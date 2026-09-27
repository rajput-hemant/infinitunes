import { beforeEach, describe, expect, it, mock } from "bun:test";

import { db } from "@infinitunes/db";
import { betterAuthAccounts, users } from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type TestUser = { id: string; email: string; password: string | null };
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
  updates: {
    table: string;
    values: Record<string, unknown>;
    where: unknown[];
  }[];
  inserts: { table: string; values: Record<string, unknown> }[];
} = { playlist: null, user: null, accounts: [], updates: [], inserts: [] };

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
  update: (table: typeof users | typeof betterAuthAccounts) => ({
    set: (values: Record<string, unknown>) => ({
      where: async (where: Parameters<PgDialect["sqlToQuery"]>[0]) => {
        const { params } = new PgDialect().sqlToQuery(where);
        state.updates.push({
          table: getTableName(table),
          values,
          where: params,
        });
      },
    }),
  }),
  insert: (table: typeof betterAuthAccounts) => ({
    values: async (values: Record<string, unknown>) => {
      state.inserts.push({ table: getTableName(table), values });
    },
  }),
};

mock.module("@infinitunes/db", () => ({ db: fakeDb }));

const { appRouter } = await import("../src/root");
const { removeSongAtPlaylistIndex } = await import("../src/router/user");
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

    await caller.user.resetPassword({
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

    await caller.user.resetPassword({
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
});
