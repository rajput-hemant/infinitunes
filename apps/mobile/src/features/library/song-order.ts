import type { SongRowItem } from "@infinitunes/types";

export const SONG_SORTS = ["recent", "title", "artist"] as const;
export type SongSort = (typeof SONG_SORTS)[number];

export function isSongSort(value: string): value is SongSort {
  return SONG_SORTS.some((sort) => sort === value);
}

/** Lowercase and strip diacritics so "beyonce" finds "Beyoncé". */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();
}

const primaryArtists = (song: SongRowItem) =>
  song.primaryArtists.map((artist) => artist.name);

function matches(song: SongRowItem, query: string): boolean {
  const haystack = [song.name, song.subtitle, ...primaryArtists(song)].join(
    " ",
  );
  return fold(haystack).includes(query);
}

const byTitle = (a: SongRowItem, b: SongRowItem) =>
  a.name.localeCompare(b.name);

const byArtist = (a: SongRowItem, b: SongRowItem) =>
  (primaryArtists(a)[0] ?? "").localeCompare(primaryArtists(b)[0] ?? "") ||
  byTitle(a, b);

/**
 * The songs matching `query` (title, credits or artist), in `sort` order.
 * `recent` keeps the list's own order, which callers pass newest first.
 */
export function orderSongs(
  songs: readonly SongRowItem[],
  query: string,
  sort: SongSort,
): SongRowItem[] {
  const folded = fold(query.trim());
  const shown = folded
    ? songs.filter((song) => matches(song, folded))
    : [...songs];
  if (sort === "title") return shown.toSorted(byTitle);
  if (sort === "artist") return shown.toSorted(byArtist);
  return shown;
}
