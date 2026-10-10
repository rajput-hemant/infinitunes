/** Search route segment to the `search.byType` procedure's `type` input. */
export const SEARCH_TYPE_MAP = {
  song: "songs",
  album: "albums",
  playlist: "playlists",
  artist: "artists",
  show: "podcasts",
} as const;

export type ListSearchType = keyof typeof SEARCH_TYPE_MAP;
export type SearchType = "all" | ListSearchType;

export function isSearchType(value: string): value is SearchType {
  return value === "all" || Object.hasOwn(SEARCH_TYPE_MAP, value);
}
