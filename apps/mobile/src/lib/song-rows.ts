import { toSongRow } from "@infinitunes/types";
import type { Song, SongRowItem } from "@infinitunes/types";

/**
 * The slim rows of a details payload's `list`, which upstream types as a
 * string when the entity has no songs.
 */
export function songRowsOf(list: string | Song[] | undefined): SongRowItem[] {
  return Array.isArray(list) ? list.map(toSongRow) : [];
}
