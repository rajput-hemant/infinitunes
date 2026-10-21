import type { FavoriteLists } from "@infinitunes/core/favorites";
import type { UserPlaylist } from "@infinitunes/core/react/optimistic-playlists";
import type { Album, Episode, Song, SongObj } from "@infinitunes/types";
import { rawAlbum, rawSong } from "@infinitunes/types/fixtures";

import { trpc, trpcClient as sharedClient } from "~/test/trpc-mock";

/**
 * `~/lib/trpc` for the library screens (`jest.mock("~/lib/trpc", () =>
 * require("./library-test-support"))`): the shared favorites and playlist
 * mocks plus the procedures these screens call, as typed `jest.fn`s answering
 * like an account with nothing saved. Override per test.
 */

export { trpc };

type PlaylistInput = { name: string; description?: string };

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

/** A favorites row; lists default to empty. */
export function favoriteLists(overrides: Partial<FavoriteLists> = {}) {
  return {
    songs: [],
    albums: [],
    playlists: [],
    artists: [],
    podcasts: [],
    ...overrides,
  } satisfies FavoriteLists;
}

/** A song whose title differs from its id, as upstream's are. */
export function songNamed(id: string, title: string, artist = "Flipperachi") {
  return rawSong({ id, title, subtitle: `${artist} - ${title}` });
}

export const trpcClient = {
  ...sharedClient,
  user: {
    getUserFavorites: {
      query: jest.fn(async (): Promise<FavoriteLists | undefined> => undefined),
    },
    getUserPlaylists: {
      query: jest.fn(async (): Promise<UserPlaylist[]> => []),
    },
    addToFavorites: sharedClient.user.addToFavorites,
    removeFromFavorites: sharedClient.user.removeFromFavorites,
    createNewPlaylist: {
      mutate: jest.fn(async (input: PlaylistInput): Promise<UserPlaylist> =>
        userPlaylist({ id: "pl-new", ...input, description: null }),
      ),
    },
    renamePlaylist: {
      mutate: jest.fn(
        async (_input: PlaylistInput & { playlistId: string }) => undefined,
      ),
    },
    deletePlaylist: {
      mutate: jest.fn(async (_input: { playlistId: string }) => undefined),
    },
    addSongsToPlaylist: {
      mutate: jest.fn(
        async (_input: { playlistId: string; songs: string[] }) => undefined,
      ),
    },
    removeSongsFromPlaylist: {
      mutate: jest.fn(
        async (_input: {
          playlistId: string;
          index: number;
          songId: string;
        }): Promise<UserPlaylist> => userPlaylist(),
      ),
    },
  },
  history: {
    list: {
      query: jest.fn(
        async (): Promise<{ id: string; type: "song" | "episode" }[]> => [],
      ),
    },
  },
  song: {
    details: {
      query: jest.fn(async (_input: { id: string }): Promise<SongObj> => ({
        songs: [],
      })),
    },
    items: {
      query: jest.fn(
        async (_input: { id: string }): Promise<SongObj<Song | Episode>> => ({
          songs: [],
        }),
      ),
    },
  },
  album: {
    details: {
      query: jest.fn(async (_input: { id: string }): Promise<Album> =>
        rawAlbum(),
      ),
    },
  },
};

/** The ids a `song.details` call asked for (one comma-joined `id`). */
function idsOf({ id }: { id: string }): string[] {
  return id.split(",");
}

/** Answers `song.details` or `song.items` from a catalog keyed by song id. */
export function catalogAnswering(catalog: Record<string, Song>) {
  return async (input: { id: string }) => ({
    songs: idsOf(input).flatMap((id) => catalog[id] ?? []),
  });
}
