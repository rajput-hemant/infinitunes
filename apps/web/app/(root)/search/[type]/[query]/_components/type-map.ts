/** Search route segment to the `search.byType` procedure's `type` input. */
export const SEARCH_TYPE_MAP = {
  song: "songs",
  album: "albums",
  playlist: "playlists",
  artist: "artists",
  show: "podcasts",
} as const;
