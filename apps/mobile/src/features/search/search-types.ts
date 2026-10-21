/** The result filters, in chip order. `all` is the combined search; the rest are `search.byType` lists. */
export const SEARCH_TYPES = [
  { type: "all", label: "All" },
  { type: "song", label: "Songs" },
  { type: "album", label: "Albums" },
  { type: "playlist", label: "Playlists" },
  { type: "artist", label: "Artists" },
  { type: "show", label: "Podcasts" },
] as const;

export type SearchType = (typeof SEARCH_TYPES)[number]["type"];

export type ListSearchType = Exclude<SearchType, "all">;

/** A list filter to the `type` the `search.byType` procedure takes. */
export const BY_TYPE_INPUT = {
  song: "songs",
  album: "albums",
  playlist: "playlists",
  artist: "artists",
  show: "podcasts",
} as const satisfies Record<ListSearchType, string>;
