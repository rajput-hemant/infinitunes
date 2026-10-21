/** Types the favorites table has a column for; other media types are not likable. */
export const FAVORITE_TYPES = [
  "song",
  "album",
  "playlist",
  "artist",
  "show",
] as const;

export type FavoriteType = (typeof FAVORITE_TYPES)[number];

export function isFavoriteType(type: string): type is FavoriteType {
  return (FAVORITE_TYPES as readonly string[]).includes(type);
}

/** The liked tokens per column, as the `user.getUserFavorites` row holds them. */
export type FavoriteLists = Record<
  "songs" | "albums" | "playlists" | "artists" | "podcasts",
  string[]
>;

type FavoriteCopy = {
  column: keyof FavoriteLists;
  label: string;
  added: (name: string) => string;
  removed: (name: string) => string;
};

const removedDefault = (name: string) =>
  `Successfully removed "${name}" from favorites!`;

/** Favorites column and confirmation copy per likable type. */
export const FAVORITE_COPY: Record<FavoriteType, FavoriteCopy> = {
  song: {
    column: "songs",
    label: "Song",
    removed: removedDefault,
    added: (name) => `"${name}" song added to favorites!`,
  },
  album: {
    column: "albums",
    label: "Album",
    removed: removedDefault,
    added: (name) => `"${name}" album added to favorites!`,
  },
  playlist: {
    column: "playlists",
    label: "Playlist",
    removed: (name) => `"${name}" playlist removed from favorites!`,
    added: (name) => `"${name}" playlist added to favorites!`,
  },
  artist: {
    column: "artists",
    label: "Artist",
    removed: removedDefault,
    added: (name) => `"${name}" artist added to favorites!`,
  },
  show: {
    column: "podcasts",
    label: "Podcast",
    removed: () => "Removed from favorites!",
    added: () => "Added Podcast to favorites!",
  },
};

/** Whether the server's favorites row has `token` liked; unknown (`undefined`/`null`) is not liked. */
export function isFavorited(
  lists: FavoriteLists | null | undefined,
  type: FavoriteType,
  token: string,
): boolean {
  return lists?.[FAVORITE_COPY[type].column].includes(token) ?? false;
}
