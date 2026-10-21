import {
  fetchLikedSongsNewestFirst,
  fetchSongsChunked,
} from "@infinitunes/core/liked-songs";
import { toSongRow } from "@infinitunes/types";
import type { Song, SongRowItem } from "@infinitunes/types";

import { trpcClient } from "./trpc";

/**
 * The slim rows of a details payload's `list`, which upstream types as a
 * string when the entity has no songs.
 */
export function songRowsOf(list: string | Song[] | undefined): SongRowItem[] {
  return Array.isArray(list) ? list.map(toSongRow) : [];
}

const songDetails = (input: { id: string }) =>
  trpcClient.song.details.query(input);

/**
 * The rows of the saved song ids, in the order of `ids` (ids upstream no
 * longer has are left out); `undefined` when no lookup succeeded.
 */
export async function fetchSongRows(
  ids: readonly string[],
): Promise<SongRowItem[] | undefined> {
  const songs = await fetchSongsChunked([...ids], songDetails);
  if (!songs) return undefined;
  const byId = new Map(songs.map((song) => [song.id, toSongRow(song)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** The rows of the liked song ids, newest like first; `undefined` as above. */
export async function fetchLikedSongRows(
  ids: readonly string[],
): Promise<SongRowItem[] | undefined> {
  const songs = await fetchLikedSongsNewestFirst([...ids], songDetails);
  return songs?.map(toSongRow);
}
