import {
  lookupSongsChunked,
  resolveWithCache,
  type ItemCache,
  type Lookup,
} from "@infinitunes/core/liked-songs";
import { toSongRow } from "@infinitunes/types";
import type { Episode, Song, SongRowItem } from "@infinitunes/types";

import { trpcClient } from "./trpc";

/**
 * The slim rows of a details payload's `list`, which upstream types as a
 * string when the entity has no songs.
 */
export function songRowsOf(list: string | Song[] | undefined): SongRowItem[] {
  return Array.isArray(list) ? list.map(toSongRow) : [];
}

/** A cache that knows nothing: every id is looked up. */
const NO_CACHE: ItemCache<SongRowItem> = {
  get: () => undefined,
  set: () => {},
};

/** A song lookup's rows, keyed as it found them. */
export function toRowLookup({
  found,
  gone,
}: Lookup<Song | Episode>): Lookup<SongRowItem> {
  const rows = new Map<string, SongRowItem>();
  for (const [id, song] of found) rows.set(id, toSongRow(song));
  return { found: rows, gone };
}

const lookupSongRows = async (ids: string[]) =>
  toRowLookup(
    await lookupSongsChunked(ids, (input) =>
      trpcClient.song.details.query(input),
    ),
  );

/**
 * The rows of the saved song ids, in the order of `ids` (ids upstream no
 * longer has are left out); `undefined` when no lookup succeeded. With a
 * `cache` only the ids it does not hold are fetched.
 */
export function fetchSongRows(
  ids: readonly string[],
  cache: ItemCache<SongRowItem> = NO_CACHE,
): Promise<SongRowItem[] | undefined> {
  return resolveWithCache(ids, cache, lookupSongRows);
}

/**
 * The rows of the liked song ids, newest like first; `undefined` as above.
 * Likes are stored append-only, oldest first.
 */
export function fetchLikedSongRows(
  ids: readonly string[],
  cache?: ItemCache<SongRowItem>,
): Promise<SongRowItem[] | undefined> {
  return fetchSongRows([...ids].reverse(), cache);
}
