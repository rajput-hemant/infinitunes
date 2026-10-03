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

type TestUser = { id: string; email: string; password: string | null };
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
  lookups: string[];
} = {
  playlist: null,
  user: null,
  accounts: [],
  updates: [],
  inserts: [],
  deletes: [],
  updateError: null,
  lookups: [],
};

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
      findFirst: async (opts?: {
        columns?: { password?: boolean };
        where?: unknown;
      }) => {
        if (typeof opts?.where === "function") {
          const lookup = (
            opts.where as (
              row: { email: string },
              ops: { eq: (col: string, value: string) => string },
            ) => string
          )({ email: "email" }, { eq: (_col, value) => value });
          state.lookups.push(lookup);
          if (state.user?.email !== lookup) return undefined;
        }
        if (!state.user || opts?.columns?.password !== false) return state.user;
        const { password: _password, ...rest } = state.user;
        return rest;
      },
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
};

mock.module("@infinitunes/db", () => ({ db: fakeDb }));

const { appRouter } = await import("../src/root");
const { PLAYLIST_MAX_SONGS, removeSongAtPlaylistIndex } =
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
    state.lookups = [];
  });

  it("rejects protected procedures without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(caller.user.getUserPlaylists({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("keeps the logged-out reset flow callable without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(
      caller.user.resetPasswordAnonymous({
        email: "user@example.com",
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Email or current password is incorrect",
    });
  });

  it("answers unknown email, wrong password and passwordless accounts identically", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });
    const attempt = () =>
      caller.user
        .resetPasswordAnonymous({
          email: "user@example.com",
          password: "WrongPassword1!",
          newPassword: "NewPassword2!",
        })
        .catch((error: unknown) => error);

    const unknown = await attempt();

    state.user = {
      id: "user-123",
      email: "user@example.com",
      password: await hash("CurrentPassword1!", 10),
    };
    const wrongPassword = await attempt();

    state.user = { id: "user-123", email: "user@example.com", password: null };
    const passwordless = await attempt();

    for (const error of [unknown, wrongPassword, passwordless]) {
      expect(error).toMatchObject({
        code: "BAD_REQUEST",
        message: "Email or current password is incorrect",
      });
    }
    expect(state.updates).toHaveLength(0);
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
      password: await hash("CurrentPassword1!", 10),
    };

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
      password: await hash("CurrentPassword1!", 10),
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
      password: await hash("CurrentPassword1!", 10),
    };

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

  it("resets a legacy password by creating a credential account", async () => {
    state.user = {
      id: "user-123",
      email: "user@example.com",
      password: await hash("CurrentPassword1!", 10),
    };
    state.accounts = [
      {
        id: "oauth-account",
        userId: state.user.id,
        accountId: "google-user",
        providerId: "google",
        password: null,
      },
    ];
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await caller.user.resetPasswordAnonymous({
      email: state.user.email,
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    expect(state.inserts).toHaveLength(1);
    expect(state.inserts[0]).toMatchObject({
      table: "better_auth_account",
      values: {
        userId: state.user.id,
        accountId: state.user.id,
        providerId: "credential",
      },
    });
    const insertedPassword = state.inserts[0]?.values.password;
    expect(insertedPassword).toBeTypeOf("string");
    expect(await compare("NewPassword2!", insertedPassword as string)).toBe(
      true,
    );
    expect(state.updates.some((update) => update.table === "user")).toBe(true);
    expect(
      state.updates.some((update) => update.table === "better_auth_account"),
    ).toBe(false);
  });

  it("resets the password for a mixed-case, padded email", async () => {
    state.user = {
      id: "user-123",
      email: "user@example.com",
      password: await hash("CurrentPassword1!", 10),
    };
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await caller.user.resetPasswordAnonymous({
      email: "  User@Example.COM ",
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    expect(state.lookups).toEqual(["user@example.com"]);
    const userUpdate = state.updates.find((update) => update.table === "user");
    expect(userUpdate?.where).toContain("user@example.com");
    expect(state.inserts).toHaveLength(1);
  });

  it("uses the credential account hash when an OAuth account sorts first", async () => {
    const credentialPassword = await hash("CurrentPassword1!", 10);
    state.user = {
      id: "user-123",
      email: "user@example.com",
      password: null,
    };
    state.accounts = [
      {
        id: "oauth-account",
        userId: state.user.id,
        accountId: "google-user",
        providerId: "google",
        password: null,
      },
      {
        id: "credential-account",
        userId: state.user.id,
        accountId: state.user.id,
        providerId: "credential",
        password: credentialPassword,
      },
    ];
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await caller.user.resetPasswordAnonymous({
      email: state.user.email,
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    const accountUpdate = state.updates.find(
      (update) => update.table === "better_auth_account",
    );
    expect(accountUpdate?.where).toContain("credential-account");
    const updatedPassword = accountUpdate?.values.password;
    expect(updatedPassword).toBeTypeOf("string");
    expect(await compare("NewPassword2!", updatedPassword as string)).toBe(
      true,
    );
    expect(state.inserts).toHaveLength(0);
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

  it("resolves a lazy session thunk before authorizing", async () => {
    const caller = createCallerFactory(appRouter)({
      db,
      session: async () => ({ user: { id: "user-123" } }),
    });

    await expect(caller.user.getUserPlaylists({})).resolves.toEqual([]);
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
      password: await hash("CurrentPassword1!", 10),
    };
  }

  it("rejects the signed-in password change without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(
      caller.user.resetPassword({
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("changes the session user's password and revokes only their other sessions", async () => {
    await seedPasswordUser();

    await signedIn("current-token").user.resetPassword({
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    const userUpdate = state.updates.find((update) => update.table === "user");
    expect(userUpdate?.where).toContain("user@example.com");
    expect(
      await compare("NewPassword2!", userUpdate?.values.password as string),
    ).toBe(true);
    expect(state.deletes).toHaveLength(1);
    expect(state.deletes[0]?.table).toBe("better_auth_session");
    expect(state.deletes[0]?.where).toEqual(["user-123", "current-token"]);
  });

  it("revokes every session when the current token is unknown", async () => {
    await seedPasswordUser();

    await signedIn().user.resetPassword({
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });

    expect(state.deletes[0]?.where).toEqual(["user-123"]);
  });

  it("does not change the password or revoke sessions on a wrong current password", async () => {
    await seedPasswordUser();

    await expect(
      signedIn("t").user.resetPassword({
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

  it("returns a clear error for passwordless accounts", async () => {
    state.user = { id: "user-123", email: "user@example.com", password: null };

    await expect(
      signedIn("t").user.resetPassword({
        password: "CurrentPassword1!",
        newPassword: "NewPassword2!",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("has no password"),
    });
    await expect(
      signedIn().user.deleteUser({ password: "CurrentPassword1!" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringContaining("has no password"),
    });
    expect(state.deletes).toHaveLength(0);
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
      emailVerified: null,
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
});
