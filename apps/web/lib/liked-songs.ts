import type { Episode, Song } from "@infinitunes/types";

import { getErrorCode } from "./error-code";

const LIKED_SONGS_CHUNK_SIZE = 25;
const RECOVERY_CONCURRENCY = 3;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Fetch song details in chunks, tolerating partial failure. Returns undefined
 * only when every details request failed. Upstream `song.getDetails` also resolves
 * episode ids, so pass `Song | Episode` for mixed lists.
 */
export async function fetchSongsChunked<T extends Song | Episode = Song>(
  ids: string[],
  details: (input: { id: string }) => Promise<{ songs: T[] }>,
  size = LIKED_SONGS_CHUNK_SIZE,
): Promise<T[] | undefined> {
  const chunks = chunk(ids, size);
  const settled = await Promise.allSettled(
    chunks.map((c) => details({ id: c.join(",") })),
  );

  const results: (T[] | undefined)[] = [];
  const poisoned: number[] = [];
  let failed = 0;
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      results[i] = result.value.songs;
    } else if (
      chunks[i]!.length > 1 &&
      getErrorCode(result.reason) === "NOT_FOUND"
    ) {
      poisoned.push(i);
    } else {
      failed += 1;
      console.error("song-details: failed to fetch a chunk", result.reason);
    }
  });

  // A delisted id poisons its whole batch: retry that chunk id by id, with a
  // few chunks at a time. Only NOT_FOUND is skippable; any other error is an
  // outage and surfaces instead of returning a silently truncated list.
  let next = 0;
  let aborted = false;
  let dropped = 0;
  const worker = async () => {
    while (!aborted && next < poisoned.length) {
      const i = poisoned[next++]!;
      const recovered: T[] = [];
      let missing = 0;
      for (const id of chunks[i]!) {
        try {
          recovered.push(...(await details({ id })).songs);
        } catch (error) {
          if (getErrorCode(error) !== "NOT_FOUND") {
            aborted = true;
            throw error;
          }
          missing += 1;
        }
      }
      if (missing === chunks[i]!.length) {
        failed += 1;
        console.error(
          "song-details: failed to fetch a chunk",
          (settled[i] as PromiseRejectedResult).reason,
        );
      } else {
        results[i] = recovered;
        dropped += missing;
      }
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(RECOVERY_CONCURRENCY, poisoned.length) },
      worker,
    ),
  );
  if (poisoned.length > 0) {
    console.error(
      `song-details: recovered ${poisoned.length} chunk(s) by id, ${dropped} id(s) unresolvable`,
    );
  }

  if (failed === chunks.length && chunks.length > 0) return undefined;
  return results.flatMap((songs) => songs ?? []);
}

/** Items in the order of `ids`, dropping ids that did not resolve. */
export function orderByIds<T extends { id: string }>(
  ids: string[],
  items: T[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/**
 * Liked songs, newest like first. Favourites are stored append-only, so the
 * stored order is oldest-first; reverse it before fetching and order the
 * result by it (upstream does not guarantee order within a chunk).
 */
export async function fetchLikedSongsNewestFirst<T extends Song | Episode>(
  stored: string[],
  details: (input: { id: string }) => Promise<{ songs: T[] }>,
  size?: number,
): Promise<T[] | undefined> {
  const ids = [...stored].reverse();
  const fetched = await fetchSongsChunked(ids, details, size);
  return fetched && orderByIds(ids, fetched);
}
