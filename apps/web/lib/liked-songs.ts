import type { Episode, Song } from "@infinitunes/types";

import { getErrorCode } from "./error-code";

const LIKED_SONGS_CHUNK_SIZE = 25;

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
  const results = await Promise.allSettled(
    chunks.map(async (c) => {
      try {
        return await details({ id: c.join(",") });
      } catch (error) {
        if (c.length === 1 || getErrorCode(error) !== "NOT_FOUND") throw error;
        console.error("song-details: failed to fetch a chunk", error);
        // A delisted id can poison the batch; recover its resolvable neighbours.
        const recovered: T[] = [];
        let succeeded = false;
        for (const id of c) {
          try {
            const result = await details({ id });
            recovered.push(...result.songs);
            succeeded = true;
          } catch (idError) {
            console.error("song-details: failed to fetch an id", idError);
          }
        }
        if (!succeeded) throw error;
        return { songs: recovered };
      }
    }),
  );

  const songs: T[] = [];
  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      songs.push(...result.value.songs);
    } else {
      failed += 1;
      console.error("song-details: failed to fetch a chunk", result.reason);
    }
  }

  if (failed === results.length && results.length > 0) return undefined;
  return songs;
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
