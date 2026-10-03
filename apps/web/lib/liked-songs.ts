import type { Song } from "@infinitunes/types";

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
 * only when every chunk failed.
 */
export async function fetchSongsChunked(
  ids: string[],
  details: (input: { id: string }) => Promise<{ songs: Song[] }>,
  size = LIKED_SONGS_CHUNK_SIZE,
): Promise<Song[] | undefined> {
  const chunks = chunk(ids, size);
  const results = await Promise.allSettled(
    chunks.map((c) => details({ id: c.join(",") })),
  );

  const songs: Song[] = [];
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
