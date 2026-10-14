import { beforeEach, describe, expect, it, mock } from "bun:test";

let user: { id: string } | undefined;
let playlists: () => Promise<unknown>;
let favorites: () => Promise<unknown>;

mock.module("server-only", () => ({}));
mock.module("next/navigation", () => ({
  unstable_rethrow: () => {},
  notFound: () => {},
}));
mock.module("~/lib/auth", () => ({ getUser: async () => user }));
mock.module("~/lib/db/queries", () => ({
  getUserPlaylists: () => playlists(),
  getUserFavorites: () => favorites(),
}));

const { getViewer } = await import("../../lib/viewer");

beforeEach(() => {
  user = undefined;
  playlists = async () => [{ id: "p1" }];
  favorites = async () => ({ songs: [] });
});

describe("getViewer", () => {
  it("is empty for a signed-out visitor and never reads the library", async () => {
    let read = 0;
    playlists = async () => {
      read++;
      return [];
    };
    favorites = playlists;

    expect(await getViewer()).toEqual({
      user: undefined,
      playlists: undefined,
      favorites: undefined,
    });
    expect(read).toBe(0);
  });

  it("carries the user with their playlists and favorites", async () => {
    user = { id: "u1" };

    expect(await getViewer()).toEqual({
      user: { id: "u1" },
      playlists: [{ id: "p1" }],
      favorites: { songs: [] },
    });
  });

  it("degrades a failed library read instead of failing the layout", async () => {
    user = { id: "u1" };
    playlists = async () => {
      throw new Error("db down");
    };
    favorites = async () => {
      throw new Error("db down");
    };
    const errors = console.error;
    console.error = () => {};
    try {
      expect(await getViewer()).toEqual({
        user: { id: "u1" },
        playlists: undefined,
        favorites: null,
      });
    } finally {
      console.error = errors;
    }
  });
});
