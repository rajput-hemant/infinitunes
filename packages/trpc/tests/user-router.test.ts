import { beforeEach, describe, expect, it, mock } from "bun:test";

import { db } from "@infinitunes/db";
import {
  betterAuthAccounts,
  betterAuthSessions,
  myPlaylists,
  users,
} from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type TestUser = { id: string; email: string };
type Write = {
  table: string;
  values: Record<string, unknown>;
  where: unknown[];
};
type TestAccount = {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  password: string | null;
};

const state: {
  playlist: { id: string; userId: string; songs: string[] } | null;
  user: TestUser | null;
  accounts: TestAccount[];
  updates: Write[];
  inserts: { table: string; values: Record<string, unknown> }[];
  deletes: { table: string; where: unknown[] }[];
  updateError: Error | null;
  deleteError: Error | null;
} = {
  playlist: null,
  user: null,
  accounts: [],
  updates: [],
  inserts: [],
  deletes: [],
  updateError: null,
  deleteError: null,
};

const fakeDb = {
  query: {
    myPlaylists: {
      findFirst: async ({
        where,
      }: {
        where: Parameters<PgDialect["sqlToQuery"]>[0];
      }) => {
        // Honor the `where` clause like SQL would: every bound param must
        // match the row, so a missing owner predicate exposes foreign rows.
        if (!state.playlist || !where) return state.playlist;
        const { params } = new PgDialect().sqlToQuery(where);
        const row = state.playlist;
        return (params as unknown[]).every(
          (param) => param === row.id || param === row.userId,
        )
          ? row
          : null;
      },
      findMany: async () => [],
    },
    favorites: {
      findFirst: async () => null,
    },
    users: {
      findFirst: async () => state.user,
    },
    betterAuthAccounts: {
      findFirst: async ({
        where,
      }: {
        where: Parameters<PgDialect["sqlToQuery"]>[0];
      }) => {
        const { params } = new PgDialect().sqlToQuery(where);
        return state.accounts.find(
          (account) =>
            params.includes(account.userId) &&
            (!params.includes("credential") ||
              account.providerId === "credential"),
        );
      },
    },
  },
  update: (
    table: typeof users | typeof betterAuthAccounts | typeof myPlaylists,
  ) => ({
    set: (values: Record<string, unknown>) => ({
      where: (where: Parameters<PgDialect["sqlToQuery"]>[0]) => {
        const done = (async () => {
          if (state.updateError) throw state.updateError;
          const { params } = new PgDialect().sqlToQuery(where);
          state.updates.push({
            table: getTableName(table),
            values,
            where: params,
          });
        })();
        return Object.assign(done, {
          returning: async () => {
            await done;
            return [{ ...state.playlist, ...values }];
          },
        });
      },
    }),
  }),
  delete: (table: typeof betterAuthSessions | typeof users) => ({
    where: (where: Parameters<PgDialect["sqlToQuery"]>[0]) => {
      const { params } = new PgDialect().sqlToQuery(where);
      state.deletes.push({ table: getTableName(table), where: params });
      if (state.deleteError) throw state.deleteError;
      return Object.assign(Promise.resolve(), {
        returning: async () => (state.user ? [state.user] : []),
      });
    },
  }),
  insert: (table: typeof betterAuthAccounts) => ({
    values: async (values: Record<string, unknown>) => {
      state.inserts.push({ table: getTableName(table), values });
    },
  }),
  transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const updates = [...state.updates];
    const inserts = [...state.inserts];
    const deletes = [...state.deletes];
    try {
      return await fn(fakeDb);
    } catch (error) {
      state.updates = updates;
      state.inserts = inserts;
      state.deletes = deletes;
      throw error;
    }
  },
};

mock.module("@infinitunes/db", () => ({ db: fakeDb }));

const { appRouter } = await import("../src/root");
const { FRESH_SESSION_MS, PLAYLIST_MAX_SONGS, removeSongAtPlaylistIndex } =
  await import("../src/router/user");
const { createCallerFactory } = await import("../src/trpc");

describe("removeSongAtPlaylistIndex", () => {
  it("removes only the occurrence at the given index when songId matches", () => {
    expect(removeSongAtPlaylistIndex(["a", "a", "b"], 0, "a")).toEqual([
      "a",
      "b",
    ]);
    expect(removeSongAtPlaylistIndex(["a", "a", "b"], 1, "a")).toEqual([
      "a",
      "b",
    ]);
    expect(removeSongAtPlaylistIndex(["a", "a", "b"], 2, "b")).toEqual([
      "a",
      "a",
    ]);
    expect(removeSongAtPlaylistIndex(["a"], 1, "a")).toBeNull();
  });

  it("rejects a filtered-list index that points at a different stored song", () => {
    const stored = ["A", "B", "C"];
    expect(removeSongAtPlaylistIndex(stored, 1, "C")).toBeNull();
    expect(removeSongAtPlaylistIndex(stored, 2, "C")).toEqual(["A", "B"]);
  });

  it("rejects stale songId at the correct db index", () => {
    expect(removeSongAtPlaylistIndex(["A", "B", "C"], 2, "A")).toBeNull();
  });
});

describe("user router authorization", () => {
  beforeEach(() => {
    state.playlist = null;
    state.user = null;
    state.accounts = [];
    state.updates = [];
    state.inserts = [];
    state.deletes = [];
    state.updateError = null;
    state.deleteError = null;
  });

  it("rejects protected procedures without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(caller.user.getUserPlaylists()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a malformed email in updateUser before writing", async () => {
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    await expect(
      caller.user.updateUser({ email: "not-an-email" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updates).toHaveLength(0);
  });

  it("rejects an empty or oversized updateUser name before writing", async () => {
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    await expect(caller.user.updateUser({ name: "  " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      caller.user.updateUser({ name: "x".repeat(101) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updates).toHaveLength(0);
  });

  it("rejects oversized favorite tokens and song batches before writing", async () => {
    state.playlist = { id: "playlist-1", userId: "user-123", songs: [] };
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    await expect(
      caller.user.addToFavorites({ token: "x".repeat(65), type: "song" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.user.addSongsToPlaylist({
        playlistId: "playlist-1",
        songs: Array.from({ length: 501 }, (_, i) => `song-${i}`),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.user.addSongsToPlaylist({
        playlistId: "playlist-1",
        songs: ["x".repeat(65)],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.updates).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
  });

  it("normalizes the updateUser email before writing", async () => {
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    state.user = {
      id: "user-123",
      email: "old@example.com",
    };
    state.accounts = [
      {
        id: "credential-123",
        userId: "user-123",
        accountId: "user-123",
        providerId: "credential",
        password: await hash("CurrentPassword1!", 10),
      },
    ];

    await caller.user.updateUser({
      email: "New@Example.COM",
      currentPassword: "CurrentPassword1!",
    });

    expect(state.updates[0]?.values).toMatchObject({
      email: "new@example.com",
    });
  });

  it("omits the password column from the updateUser return value", async () => {
    state.user = {
      id: "user-123",
      email: "user@example.com",
    };
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    const result = await caller.user.updateUser({ name: "New Name" });

    expect(result).toMatchObject({ id: "user-123" });
    expect(result).not.toHaveProperty("password");
  });

  it("maps a duplicate email in updateUser to CONFLICT", async () => {
    state.updateError = new Error("Failed query", {
      cause: { code: "23505" },
    });
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    state.user = {
      id: "user-123",
      email: "old@example.com",
    };

    state.accounts = [
      {
        id: "credential-123",
        userId: "user-123",
        accountId: "user-123",
        providerId: "credential",
        password: await hash("CurrentPassword1!", 10),
      },
    ];

    await expect(
      caller.user.updateUser({
        email: "taken@example.com",
        currentPassword: "CurrentPassword1!",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "That email is already in use",
    });
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
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Unauthorized",
    });
    await expect(
      caller.user.removeSongsFromPlaylist({
        playlistId: "playlist-victim",
        index: 0,
        songId: "existing-song",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Unauthorized",
    });
    await expect(
      caller.user.renamePlaylist({
        playlistId: "playlist-victim",
        name: "Hijacked",
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Unauthorized",
    });
    await expect(
      caller.user.deletePlaylist({ playlistId: "playlist-victim" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Unauthorized",
    });
  });

  it("returns the owner's playlist from getPlaylistDetails", async () => {
    state.playlist = {
      id: "playlist-own",
      userId: "user-123",
      songs: ["song-1"],
    };
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: "user-123" } },
    });

    await expect(
      caller.user.getPlaylistDetails({ playlistId: "playlist-own" }),
    ).resolves.toMatchObject({ id: "playlist-own", userId: "user-123" });
  });

  it("resolves a lazy session thunk before authorizing", async () => {
    const caller = createCallerFactory(appRouter)({
      db,
      session: async () => ({ user: { id: "user-123" } }),
    });

    await expect(caller.user.getUserPlaylists()).resolves.toEqual([]);
  });

  const signedIn = (token?: string) =>
    createCallerFactory(appRouter)({
      db,
      session: {
        user: { id: "user-123" },
        ...(token ? { session: { token } } : {}),
      },
    });

  async function seedPasswordUser() {
    state.user = {
      id: "user-123",
      email: "user@example.com",
    };
    state.accounts = [
      {
        id: "credential-123",
        userId: "user-123",
        accountId: "user-123",
        providerId: "credential",
        password: await hash("CurrentPassword1!", 10),
      },
    ];
  }

  it("rejects the signed-in password change without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(
      caller.user.changePassword({
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("changes the session user's password and revokes only their other sessions", async () => {
    await seedPasswordUser();

    await signedIn("current-token").user.changePassword({
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    const accountUpdate = state.updates.find(
      (update) => update.table === "better_auth_account",
    );
    expect(accountUpdate?.where).toContain("credential-123");
    expect(
      await compare("NewPassword2!", accountUpdate?.values.password as string),
    ).toBe(true);
    expect(state.updates.some((update) => update.table === "user")).toBe(false);
    expect(state.deletes).toHaveLength(1);
    expect(state.deletes[0]?.table).toBe("better_auth_session");
    expect(state.deletes[0]?.where).toEqual(["user-123", "current-token"]);
  });

  it("rolls back password writes when session revocation fails", async () => {
    await seedPasswordUser();
    state.deleteError = new Error("session revoke failed");

    await expect(
      signedIn("current-token").user.changePassword({
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toThrow("session revoke failed");

    expect(state.updates).toHaveLength(0);
    expect(state.inserts).toHaveLength(0);
    expect(state.deletes).toHaveLength(0);
  });

  it("revokes every session when the current token is unknown", async () => {
    await seedPasswordUser();

    await signedIn().user.changePassword({
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    expect(state.deletes[0]?.where).toEqual(["user-123"]);
  });

  it("does not change the password or revoke sessions on a wrong current password", async () => {
    await seedPasswordUser();

    await expect(
      signedIn("t").user.changePassword({
        password: "WrongPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Current password is incorrect",
    });
    expect(state.updates).toHaveLength(0);
    expect(state.deletes).toHaveLength(0);
  });

  it("tells a passwordless account to use Forgot password for a password change", async () => {
    state.user = { id: "user-123", email: "user@example.com" };

    await expect(
      signedIn("t").user.changePassword({
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("Forgot password"),
    });
    expect(state.updates).toHaveLength(0);
  });

  describe("passwordless accounts use a fresh session", () => {
    const sessionAge = (ms: number) =>
      createCallerFactory(appRouter)({
        db,
        session: {
          user: { id: "user-123" },
          session: { token: "t", createdAt: new Date(Date.now() - ms) },
        },
      });

    beforeEach(() => {
      state.user = {
        id: "user-123",
        email: "user@example.com",
      };
    });

    it("deletes the account with a session created inside the window", async () => {
      const deleted = await sessionAge(
        FRESH_SESSION_MS - 60_000,
      ).user.deleteUser({});

      expect(deleted).toMatchObject({ id: "user-123" });
      expect(state.deletes).toEqual([{ table: "user", where: ["user-123"] }]);
    });

    it("asks to sign in again with an older session", async () => {
      await expect(
        sessionAge(FRESH_SESSION_MS + 60_000).user.deleteUser({}),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Please sign in again to continue",
      });
      expect(state.deletes).toHaveLength(0);
    });

    it("treats a session with no creation time as stale", async () => {
      await expect(signedIn("t").user.deleteUser({})).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Please sign in again to continue",
      });
    });

    it("changes the email only with a fresh session, and resets verification", async () => {
      await expect(
        sessionAge(FRESH_SESSION_MS + 60_000).user.updateUser({
          email: "new@example.com",
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(state.updates).toHaveLength(0);

      await sessionAge(1000).user.updateUser({ email: "new@example.com" });

      expect(state.updates[0]?.values).toEqual({
        email: "new@example.com",
        emailVerifiedBoolean: false,
      });
    });

    it("still ignores a stale session for a name-only update", async () => {
      await sessionAge(FRESH_SESSION_MS + 60_000).user.updateUser({
        name: "New Name",
      });

      expect(state.updates[0]?.values).toEqual({ betterAuthName: "New Name" });
    });
  });

  it("does not let a fresh session bypass the password on an account that has one", async () => {
    await seedPasswordUser();
    const fresh = createCallerFactory(appRouter)({
      db,
      session: {
        user: { id: "user-123" },
        session: { token: "t", createdAt: new Date() },
      },
    });

    await expect(fresh.user.deleteUser({})).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Enter your current password to continue",
    });
    expect(state.deletes).toHaveLength(0);
  });

  it("uses the credential account hash when an OAuth account sorts first", async () => {
    state.user = { id: "user-123", email: "user@example.com" };
    state.accounts = [
      {
        id: "oauth-account",
        userId: "user-123",
        accountId: "google-user",
        providerId: "google",
        password: null,
      },
      {
        id: "credential-account",
        userId: "user-123",
        accountId: "user-123",
        providerId: "credential",
        password: await hash("CurrentPassword1!", 10),
      },
    ];

    await expect(
      signedIn().user.deleteUser({ password: "WrongPassword1!" }),
    ).rejects.toMatchObject({ message: "Current password is incorrect" });
    await signedIn().user.deleteUser({ password: "CurrentPassword1!" });
    expect(state.deletes).toHaveLength(1);
  });

  it("requires a password to delete the account", async () => {
    await seedPasswordUser();

    await expect(
      signedIn().user.deleteUser({} as { password: string }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      signedIn().user.deleteUser({ password: "WrongPassword1!" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Current password is incorrect",
    });
    expect(state.deletes).toHaveLength(0);
  });

  it("deletes the account when the password matches", async () => {
    await seedPasswordUser();

    const deleted = await signedIn().user.deleteUser({
      password: "CurrentPassword1!",
    });

    expect(deleted).toMatchObject({ id: "user-123" });
    expect(state.deletes).toEqual([{ table: "user", where: ["user-123"] }]);
  });

  it("requires the current password to change the email", async () => {
    await seedPasswordUser();

    await expect(
      signedIn().user.updateUser({ email: "new@example.com" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      signedIn().user.updateUser({
        email: "new@example.com",
        currentPassword: "WrongPassword1!",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Current password is incorrect",
    });
    expect(state.updates).toHaveLength(0);
  });

  it("resets email verification when the email changes", async () => {
    await seedPasswordUser();

    await signedIn().user.updateUser({
      email: "new@example.com",
      currentPassword: "CurrentPassword1!",
    });

    expect(state.updates[0]?.values).toEqual({
      email: "new@example.com",
      emailVerifiedBoolean: false,
    });
  });

  it("updates the name without a password, and ignores an unchanged email", async () => {
    await seedPasswordUser();

    await signedIn().user.updateUser({
      name: "New Name",
      email: "User@Example.com",
    });

    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]?.values).toEqual({ betterAuthName: "New Name" });
  });

  describe("addSongsToPlaylist cap", () => {
    const songs = (n: number, prefix = "s") =>
      Array.from({ length: n }, (_, i) => `${prefix}-${i}`);
    const add = (input: string[]) =>
      signedIn().user.addSongsToPlaylist({
        playlistId: "playlist-1",
        songs: input,
      });

    it("appends new songs at the end", async () => {
      state.playlist = {
        id: "playlist-1",
        userId: "user-123",
        songs: ["a", "b"],
      };

      await add(["c"]);

      expect(state.updates[0]?.values.songs).toEqual(["a", "b", "c"]);
    });

    it("accepts an add that stays under the cap", async () => {
      state.playlist = {
        id: "playlist-1",
        userId: "user-123",
        songs: songs(PLAYLIST_MAX_SONGS - 10, "old"),
      };

      await add(songs(5));

      expect(state.updates[0]?.values.songs).toHaveLength(
        PLAYLIST_MAX_SONGS - 5,
      );
    });

    it("accepts an add that lands exactly on the cap", async () => {
      state.playlist = {
        id: "playlist-1",
        userId: "user-123",
        songs: songs(PLAYLIST_MAX_SONGS - 2, "old"),
      };

      await add(["x", "y"]);

      expect(state.updates[0]?.values.songs).toHaveLength(PLAYLIST_MAX_SONGS);
    });

    it("rejects the whole add when it would exceed the cap", async () => {
      state.playlist = {
        id: "playlist-1",
        userId: "user-123",
        songs: songs(PLAYLIST_MAX_SONGS - 1, "old"),
      };

      await expect(add(["x", "y"])).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Playlist is full (5,000 songs)",
      });
      expect(state.updates).toHaveLength(0);
    });

    it("does not count songs already in the playlist or repeated in the add", async () => {
      state.playlist = {
        id: "playlist-1",
        userId: "user-123",
        songs: songs(PLAYLIST_MAX_SONGS, "old"),
      };

      await add(["old-0", "old-1", "old-1"]);

      expect(state.updates[0]?.values.songs).toHaveLength(PLAYLIST_MAX_SONGS);
    });
  });

  describe("playlist text limits", () => {
    const own = () =>
      createCallerFactory(appRouter)({
        db,
        session: { user: { id: "user-123" } },
      });

    it("rejects a 101-character name and a 256-character description on create", async () => {
      await expect(
        own().user.createNewPlaylist({ name: "n".repeat(101) }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        own().user.createNewPlaylist({
          name: "Valid name",
          description: "d".repeat(256),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(state.inserts).toHaveLength(0);
    });

    it("rejects the same overruns on rename without touching the row", async () => {
      state.playlist = { id: "playlist-1", userId: "user-123", songs: [] };

      await expect(
        own().user.renamePlaylist({
          playlistId: "playlist-1",
          name: "n".repeat(101),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        own().user.renamePlaylist({
          playlistId: "playlist-1",
          name: "Valid name",
          description: "d".repeat(256),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(state.updates).toHaveLength(0);
    });

    it("accepts a 100-character name and a 255-character description", async () => {
      state.playlist = { id: "playlist-1", userId: "user-123", songs: [] };

      await own().user.renamePlaylist({
        playlistId: "playlist-1",
        name: "n".repeat(100),
        description: "d".repeat(255),
      });

      expect(state.updates[0]?.values).toMatchObject({
        name: "n".repeat(100),
        description: "d".repeat(255),
      });
    });
  });
});
