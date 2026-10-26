import type { Episode, Song } from "@infinitunes/types";

import { getErrorCode } from "./error-code";

const LIKED_SONGS_CHUNK_SIZE = 25;
const RECOVERY_CONCURRENCY = 3;

/** Parallel detail lookups for one library page; keeps a large library from flooding upstream. */
export const LIBRARY_FETCH_CONCURRENCY = 6;

/**
 * `Promise.allSettled(items.map(run))` with at most `limit` runs in flight.
 * Results keep the order of `items`.
 */
export async function settleWithLimit<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  const tasks = items.map((item) => () => run(item));
  let next = 0;
  const worker = async () => {
    for (let task = tasks[next]; task; task = tasks[next]) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await task() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, worker),
  );
  return results;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * What one lookup of several ids found: the items by id and the ids upstream
 * answered for but no longer has. An id in neither could not be fetched.
 */
export type Lookup<T> = { found: Map<string, T>; gone: string[] };

type Settled<T> = { songs: T[]; gone: string[]; failed: number };

async function settleSongsChunked<T extends Song | Episode>(
  ids: string[],
  details: (input: { id: string }) => Promise<{ songs: T[] }>,
  size: number,
): Promise<Settled<T>> {
  const chunks = chunk(ids, size);
  const settled = await settleWithLimit(
    chunks,
    LIBRARY_FETCH_CONCURRENCY,
    (c) => details({ id: c.join(",") }),
  );

  const results: (T[] | undefined)[] = [];
  const poisoned: number[] = [];
  let failed = 0;
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      results[i] = result.value.songs;
    } else if (getErrorCode(result.reason) === "NOT_FOUND") {
      if (chunks[i]!.length > 1) poisoned.push(i);
      else results[i] = [];
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
      results[i] = recovered;
      dropped += missing;
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

  // Only a chunk upstream answered can say an id is gone; a failed chunk's
  // ids are unknown, not missing.
  const gone = chunks.flatMap((held, i) => {
    const answered = results[i];
    if (!answered) return [];
    const returned = new Set(answered.map((item) => item.id));
    return held.filter((id) => !returned.has(id));
  });
  return { songs: results.flatMap((items) => items ?? []), gone, failed };
}

/**
 * Fetch song details in chunks, tolerating partial failure. Returns undefined
 * when no songs resolve and at least one request failed. NOT_FOUND is missing,
 * not a failure. Upstream `song.getDetails` also resolves
 * episode ids, so pass `Song | Episode` for mixed lists.
 */
export async function fetchSongsChunked<T extends Song | Episode = Song>(
  ids: string[],
  details: (input: { id: string }) => Promise<{ songs: T[] }>,
  size = LIKED_SONGS_CHUNK_SIZE,
): Promise<T[] | undefined> {
  const { songs, failed } = await settleSongsChunked(ids, details, size);
  return failed > 0 && songs.length === 0 ? undefined : songs;
}

/**
 * `fetchSongsChunked` as a `Lookup`: an id is gone only when the chunk that
 * held it was answered without it, never because its chunk failed.
 */
export async function lookupSongsChunked<T extends Song | Episode = Song>(
  ids: string[],
  details: (input: { id: string }) => Promise<{ songs: T[] }>,
  size = LIKED_SONGS_CHUNK_SIZE,
): Promise<Lookup<T>> {
  const { songs, gone } = await settleSongsChunked(ids, details, size);
  return { found: new Map(songs.map((item) => [item.id, item])), gone };
}

/**
 * One lookup per id, `LIBRARY_FETCH_CONCURRENCY` at a time. An id whose run
 * resolves to nothing or rejects NOT_FOUND is gone; any other rejection
 * leaves it unfetched.
 */
export async function lookupEach<T>(
  ids: string[],
  run: (id: string) => Promise<T | undefined>,
): Promise<Lookup<T>> {
  const settled = await settleWithLimit(ids, LIBRARY_FETCH_CONCURRENCY, run);
  const found = new Map<string, T>();
  const gone: string[] = [];
  settled.forEach((result, i) => {
    const id = ids[i]!;
    if (result.status === "fulfilled") {
      if (result.value === undefined) gone.push(id);
      else found.set(id, result.value);
    } else if (getErrorCode(result.reason) === "NOT_FOUND") {
      gone.push(id);
    }
  });
  return { found, gone };
}

/** Per-id memory of looked-up items: `null` is gone, `undefined` unknown. */
export type ItemCache<T> = {
  get: (id: string) => T | null | undefined;
  set: (id: string, item: T | null) => void;
};

/**
 * The items of `ids` in that order, looking up only the ids `cache` does not
 * know and remembering what the lookup found (and what it found gone). So a
 * list that gains one id makes one request, and one that loses an id none.
 * `undefined` when nothing resolved and some id could not be fetched.
 */
export async function resolveWithCache<T>(
  ids: readonly string[],
  cache: ItemCache<T>,
  lookup: (ids: string[]) => Promise<Lookup<T>>,
): Promise<T[] | undefined> {
  const known = new Map<string, T | null>();
  const misses: string[] = [];
  for (const id of new Set(ids)) {
    const cached = cache.get(id);
    if (cached === undefined) misses.push(id);
    else known.set(id, cached);
  }
  if (misses.length > 0) {
    const { found, gone } = await lookup(misses);
    for (const id of gone) {
      known.set(id, null);
      cache.set(id, null);
    }
    for (const [id, item] of found) {
      known.set(id, item);
      cache.set(id, item);
    }
  }
  const items = ids.flatMap((id) => known.get(id) ?? []);
  const failed = ids.some((id) => !known.has(id));
  return failed && items.length === 0 ? undefined : items;
}

/** Items in the order of `ids`, dropping ids that did not resolve. */
export function orderByIds<T extends { id: string }>(
  ids: readonly string[],
  items: readonly T[],
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
