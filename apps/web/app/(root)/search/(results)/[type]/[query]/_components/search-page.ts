import type { SearchReturnType, Song, SongRowItem } from "@infinitunes/types";
import { toSongRow } from "@infinitunes/types";

type SearchEntry = SearchReturnType["results"][number];

export type CardEntry = Exclude<SearchEntry, Song>;

/**
 * One fetched page of results: songs as slim rows, everything else as the
 * cards it renders. Built on the server for the first page (so raw songs never
 * reach the RSC payload) and in the client for the pages fetched on scroll.
 */
export type SearchPage = {
  total: number;
  rows: SongRowItem[];
  cards: CardEntry[];
};

function isSongEntry(result: SearchEntry): result is Song {
  return result.type === "song";
}

export function toSearchPage(result: SearchReturnType): SearchPage {
  const entries: SearchEntry[] = result.results;

  return {
    total: result.total,
    rows: entries.filter(isSongEntry).map(toSongRow),
    cards: entries.filter((entry) => !isSongEntry(entry)),
  };
}
