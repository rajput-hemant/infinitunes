import { beforeEach, describe, expect, it } from "bun:test";

import type { DbClient } from "@infinitunes/db/client";
import * as schema from "@infinitunes/db/schema";
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
type StoredRow = { table: string; userId: string; id: string };
const state = {
  row: undefined as (Lists & { userId: string }) | undefined,
  returned: [] as (Lists & { userId: string })[],
  account: undefined as { id: string; password: string | null } | undefined,
  userReads: 0,
  writes: [] as Write[],
  deleteError: undefined as Error | undefined,
  conflict: undefined as Record<string, SQL | undefined> | undefined,
  inTransaction: false,
  storedRows: [] as StoredRow[],
  failDeleteTable: undefined as string | undefined,
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
      const name = getTableName(table);
      if (
        state.deleteError &&
        (!state.failDeleteTable || state.failDeleteTable === name)
      ) {
        throw state.deleteError;
      }
      const { params, sql } = dialect.sqlToQuery(where);
      if (state.storedRows.length) {
        expect(sql).toBe(
          `"${name}"."${name === "user" ? "id" : "userId"}" = $1`,
        );
      }
      state.storedRows = state.storedRows.filter(
        (row) => row.table !== name || row.userId !== params[0],
      );
      state.writes.push({
        table: name,
        params,
        transaction: state.inTransaction,
      });
      return Object.assign(Promise.resolve(), {
        returning: async () => [{ id: "u" }],
      });
    },
  }),
  transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const before = [...state.writes];
    const rowsBefore = [...state.storedRows];
    state.inTransaction = true;
    try {
      return await fn(fakeDb);
    } catch (error) {
      state.writes = before;
      state.storedRows = rowsBefore;
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
  state.storedRows = [];
  state.failDeleteTable = undefined;
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
  it("stores a show's link token beside its id and drops it on unlike", async () => {
    state.returned = [{ userId: "u", ...emptyLists(), podcasts: ["42"] }];
    await caller().addToFavorites({
      type: "show",
      token: "42",
      linkToken: "abc_-9",
    });
    const patch = state.conflict?.podcastTokens;
    if (!patch) throw new Error("Missing podcastTokens SQL");
    const query = dialect.sqlToQuery(patch);
    expect(query.sql).toContain("||");
    expect(query.params).toContain(JSON.stringify({ "42": "abc_-9" }));

    await caller().removeFromFavorites({ type: "show", token: "42" });
    const values = state.writes.at(-1)?.values?.podcastTokens as SQL;
    expect(dialect.sqlToQuery(values).sql).toContain("-");
  });
  it("leaves the token map alone without a link token or for other types", async () => {
    state.returned = [{ userId: "u", ...emptyLists(), podcasts: ["42"] }];
    await caller().addToFavorites({ type: "show", token: "42" });
    expect(state.conflict?.podcastTokens).toBeUndefined();
    state.returned = [{ userId: "u", ...emptyLists(), songs: ["s"] }];
    await caller().addToFavorites({
      type: "song",
      token: "s",
      linkToken: "abc",
    });
    expect(state.conflict?.podcastTokens).toBeUndefined();
  });
  it("bounds the link token at the boundary", async () => {
    for (const linkToken of ["", "a".repeat(65), "a/b", "a b"]) {
      await expect(
        caller().addToFavorites({ type: "show", token: "42", linkToken }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(state.writes).toEqual([]);
  });
  it("accepts comma-bearing show tokens returned by upstream v4", async () => {
    state.returned = [{ userId: "u", ...emptyLists(), podcasts: ["174786"] }];
    await caller().addToFavorites({
      type: "show",
      token: "174786",
      linkToken: ",eI,wxvKSqU_",
    });
    const patch = state.conflict?.podcastTokens;
    if (!patch) throw new Error("Missing podcastTokens SQL");
    expect(dialect.sqlToQuery(patch).params).toContain(
      JSON.stringify({ "174786": ",eI,wxvKSqU_" }),
    );
  });
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
  const ownedTables = Object.values(schema).filter(
    (table) =>
      getTableName(table).startsWith("infinitunes_") && "userId" in table,
  );
  const ownedNames = ownedTables.map((table) => getTableName(table));
  const clearedNames = [...ownedNames, "better_auth_session"];
  const seedDeletionRows = () => {
    state.storedRows = [
      ...clearedNames,
      "user",
      "better_auth_account",
      "lipi_document",
      "infinitunes_rate_limit",
    ].flatMap((table) =>
      ["u", "other-user"].flatMap((userId) =>
        ["1", "2"].map((id) => ({ table, userId, id: `${userId}-${id}` })),
      ),
    );
    return [...state.storedRows];
  };

  it("clears only the user's Infinitunes data and all shared sessions in one transaction", async () => {
    const before = seedDeletionRows();

    expect(await caller().deleteUser({})).toEqual({ id: "u" });

    expect(state.storedRows).toEqual(
      before.filter(
        (row) => row.userId !== "u" || !clearedNames.includes(row.table),
      ),
    );
    expect(state.writes.map((write) => write.table).sort()).toEqual(
      [...clearedNames].sort(),
    );
    expect(state.writes.at(-1)?.table).toBe("better_auth_session");
    expect(state.writes.every((write) => write.transaction)).toBe(true);
    for (const write of state.writes) expect(write.params).toEqual(["u"]);
  });
  it("rolls back the library deletion when session revocation fails", async () => {
    const before = seedDeletionRows();
    state.deleteError = new Error("offline");
    state.failDeleteTable = "better_auth_session";

    await expect(caller().deleteUser({})).rejects.toThrow("offline");

    expect(state.storedRows).toEqual(before);
    expect(state.writes).toEqual([]);
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
