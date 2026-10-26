import type { FavoriteLists } from "@infinitunes/core/favorites";
import type { UserPlaylist } from "@infinitunes/core/react/optimistic-playlists";
import type { AppRouter } from "@infinitunes/trpc/types";
import type { Song } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import type { inferRouterOutputs } from "@trpc/server";

/** Database rows of the signed-in listener's library, and answers built from them. */

export function userPlaylist(overrides: Partial<UserPlaylist> = {}) {
  return {
    id: "pl-1",
    name: "Road Trip",
    description: null,
    userId: "alice",
    songs: [],
    createdAt: new Date(0),
    ...overrides,
  } satisfies UserPlaylist;
}

/** The list response deliberately excludes private ownership and song ids. */
export function playlistSummary(overrides: Partial<UserPlaylist> = {}) {
  const playlist = userPlaylist(overrides);
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    createdAt: playlist.createdAt,
    songCount: playlist.songs.length,
    coverSongs: playlist.songs.slice(0, 4),
  };
}

type FavoritesRow = NonNullable<
  inferRouterOutputs<AppRouter>["user"]["getUserFavorites"]
>;

/** The listener's favorites row (`user.getUserFavorites`); lists default to empty. */
export function favoritesRow(
  overrides: Partial<FavoriteLists> = {},
): FavoritesRow {
  return {
    id: "favorites-1",
    userId: "alice",
    songs: [],
    albums: [],
    playlists: [],
    artists: [],
    podcasts: [],
    podcastTokens: {},
    ...overrides,
  };
}

/** A song whose title differs from its id, as upstream's are. */
export function songNamed(id: string, title: string, artist = "Flipperachi") {
  return rawSong({ id, title, subtitle: `${artist} - ${title}` });
}

/** Answers `song.details` or `song.items` (one comma-joined `id`) from songs keyed by id. */
export function catalogAnswering(catalog: Record<string, Song>) {
  return async ({ id = "" }: { id?: string }) => ({
    songs: id.split(",").flatMap((songId) => catalog[songId] ?? []),
  });
}

/** A promise the test settles itself, to observe the state while a write is in flight. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
