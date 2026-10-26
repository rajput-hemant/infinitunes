import { beforeEach, describe, expect, it } from "bun:test";

import type { DbClient } from "@infinitunes/db/client";
import { users } from "@infinitunes/db/schema";
import { hash } from "bcryptjs";
import { getTableName, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import { userRouter } from "../src/router/user";
import { createCallerFactory } from "../src/trpc";

const emptyLists = () => ({
  songs: [],
  albums: [],
  playlists: [],
  artists: [],
  podcasts: [],
});
type Lists = { [K in keyof ReturnType<typeof emptyLists>]: string[] };
type Write = {
  table: string;
  values?: Record<string, unknown>;
  params?: unknown[];
  transaction: boolean;
};
const state = {
  row: undefined as (Lists & { userId: string }) | undefined,
  returned: [] as (Lists & { userId: string })[],
  account: undefined as { id: string; password: string | null } | undefined,
  userReads: 0,
  writes: [] as Write[],
  deleteError: undefined as Error | undefined,
  conflict: undefined as Record<string, SQL | undefined> | undefined,
  inTransaction: false,
};
const dialect = new PgDialect();
const fakeDb = {
  query: {
    favorites: { findFirst: async () => state.row },
    users: {
      findFirst: async () => {
        state.userReads++;
        return {
          id: "u",
          email: "old@example.com",
          emailVerifiedBoolean: true,
        };
      },
    },
    betterAuthAccounts: { findFirst: async () => state.account },
  },
  insert: () => ({
    values: () => ({
      onConflictDoUpdate: ({
        set,
      }: {
        set: Record<string, SQL | undefined>;
      }) => {
        state.conflict = set;
        return { returning: async () => state.returned };
      },
    }),
  }),
  update: (table: Parameters<typeof getTableName>[0]) => ({
    set: (values: Record<string, unknown>) => ({
      where: () => {
        state.writes.push({
          table: getTableName(table),
          values,
          transaction: state.inTransaction,
        });
        return Object.assign(Promise.resolve(), {
          returning: async () => state.returned,
        });
      },
    }),
  }),
  delete: (table: Parameters<typeof getTableName>[0]) => ({
    where: (where: SQL) => {
      if (state.deleteError) throw state.deleteError;
      state.writes.push({
        table: getTableName(table),
        params: dialect.sqlToQuery(where).params,
        transaction: state.inTransaction,
      });
      return Object.assign(Promise.resolve(), {
        returning: async () => [{ id: "u" }],
      });
    },
  }),
  transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const before = [...state.writes];
    state.inTransaction = true;
    try {
      return await fn(fakeDb);
    } catch (error) {
      state.writes = before;
      throw error;
    } finally {
      state.inTransaction = false;
    }
  },
};
const caller = (token: string | null = "current") =>
  createCallerFactory(userRouter)({
    db: fakeDb as unknown as DbClient,
    session: {
      user: { id: "u" },
      session: { token: token ?? undefined, createdAt: new Date() },
    },
  });

beforeEach(() => {
  state.row = undefined;
  state.returned = [];
  state.account = undefined;
  state.userReads = 0;
  state.writes = [];
  state.deleteError = undefined;
  state.conflict = undefined;
  state.inTransaction = false;
});

describe("favorite bounds and empty accounts", () => {
  it("returns null when a new account has no favorites row", async () => {
    expect(await caller().getUserFavorites()).toBeNull();
  });
  it("unlikes an absent row idempotently in the existing array response", async () => {
    expect(
      await caller().removeFromFavorites({ type: "song", token: "a" }),
    ).toEqual([]);
  });
  it.each(["addToFavorites", "removeFromFavorites"] as const)(
    "%s rejects an empty token before writing",
    async (method) => {
      await expect(
        caller()[method]({ type: "song", token: "" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      expect(state.conflict).toBeUndefined();
      expect(state.writes).toEqual([]);
    },
  );
  it.each([
    ["song", "songs"],
    ["album", "albums"],
    ["playlist", "playlists"],
    ["artist", "artists"],
    ["show", "podcasts"],
  ] as const)(
    "caps the %s list atomically and reports refusal",
    async (type, key) => {
      state.returned = [
        {
          userId: "u",
          ...emptyLists(),
          [key]: Array.from({ length: 5000 }, (_, i) => `old-${i}`),
        },
      ];
      await expect(
        caller().addToFavorites({ type, token: "new" }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("5,000"),
      });
      const patch = state.conflict?.[key];
      expect(patch).toBeDefined();
      if (!patch) throw new Error("Missing favorite SQL");
      const query = dialect.sqlToQuery(patch);
      expect(query.sql).toMatch(
        /case when .* = any\(.*\) then .* when cardinality\(.*\) < \$\d+ then array_append\(.*\) else .* end/,
      );
      expect(query.params).toContain(5000);
    },
  );
  it("accepts a duplicate at the cap and an add that reaches the cap", async () => {
    const songs = Array.from({ length: 5000 }, (_, i) => `song-${i}`);
    state.returned = [{ userId: "u", ...emptyLists(), songs }];
    expect(
      await caller().addToFavorites({ type: "song", token: "song-0" }),
    ).toEqual(state.returned);
    expect(
      await caller().addToFavorites({ type: "song", token: "song-4999" }),
    ).toEqual(state.returned);
  });
});

describe("account security mutations", () => {
  it("maps a foreign-key deletion failure to CONFLICT", async () => {
    const foreignKey = Object.assign(new Error("foreign key detail"), {
      code: "23503",
    });
    state.deleteError = new Error("Drizzle query failed", {
      cause: foreignKey,
    });
    await expect(caller().deleteUser({})).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("another app"),
    });
  });
  it("preserves unrelated delete failures", async () => {
    state.deleteError = new Error("offline");
    await expect(caller().deleteUser({})).rejects.toThrow("offline");
  });
  it("changes passwords using only the credential record", async () => {
    state.account = {
      id: "credential",
      password: await hash("CurrentPassword1!", 4),
    };
    await caller().changePassword({
      password: "CurrentPassword1!",
      newPassword: "NewPassword2!",
    });
    expect(state.userReads).toBe(0);
    expect(state.writes[0]?.table).toBe("better_auth_account");
  });
  it("never writes the email or touches sessions from updateUser", async () => {
    await caller().updateUser({ name: "New" });
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]?.table).toBe(getTableName(users));
    expect(state.writes[0]?.values).toEqual({ betterAuthName: "New" });
  });
});
