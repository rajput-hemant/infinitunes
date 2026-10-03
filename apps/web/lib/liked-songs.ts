import type { Episode, Song } from "@infinitunes/types";

export const LIKED_SONGS_CHUNK_SIZE = 25;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Fetch song details in chunks, tolerating partial failure. Returns undefined
 * only when every chunk failed. Upstream `song.getDetails` also resolves
 * episode ids, so pass `Song | Episode` for mixed lists.
 */
export async function fetchSongsChunked<T extends Song | Episode = Song>(
  ids: string[],
  details: (input: { id: string }) => Promise<{ songs: T[] }>,
  size = LIKED_SONGS_CHUNK_SIZE,
): Promise<T[] | undefined> {
  const chunks = chunk(ids, size);
  const results = await Promise.allSettled(
    chunks.map((c) => details({ id: c.join(",") })),
  );

  const songs: T[] = [];
  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      songs.push(...result.value.songs);
    } else {
      failed += 1;
      console.error("liked-songs: failed to fetch a chunk", result.reason);
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
