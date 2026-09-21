import { beforeEach, describe, expect, it, mock } from "bun:test";

import { db } from "@infinitunes/db";

const state: {
  playlist: { id: string; userId: string; songs: string[] } | null;
} = { playlist: null };

const fakeDb = {
  query: {
    myPlaylists: {
      findFirst: async () => state.playlist,
      findMany: async () => [],
    },
    favorites: {
      findFirst: async () => null,
    },
    users: {
      findFirst: async () => null,
    },
  },
};

mock.module("@infinitunes/db", () => ({ db: fakeDb }));

const { appRouter } = await import("../src/root");
const { createCallerFactory } = await import("../src/trpc");

describe("user router authorization", () => {
  beforeEach(() => {
    state.playlist = null;
  });

  it("rejects protected procedures without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(caller.user.getUserPlaylists({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps password reset callable without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(
      caller.user.resetPassword({
        email: "user@example.com",
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("does not expose or mutate another user's playlist", async () => {
    state.playlist = {
      id: "playlist-victim",
      userId: "user-456",
      songs: ["existing-song"],
    };
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    await expect(
      caller.user.getPlaylistDetails({ playlistId: "playlist-victim" }),
    ).resolves.toBeUndefined();
    await expect(
      caller.user.addSongsToPlaylist({
        playlistId: "playlist-victim",
        songs: ["attacker-song"],
      }),
    ).rejects.toThrow("Unauthorized");
  });
});
