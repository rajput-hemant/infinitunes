import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { DbClient } from "@infinitunes/db/client";
import { recentlyPlayed } from "@infinitunes/db/schema";
import { getTableName, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

type Row = { id: string; type: string };

const state: {
  rows: Row[];
  inserted: { table: string; values: Record<string, unknown> }[];
  conflict: { target: unknown[]; set: Record<string, unknown> } | null;
  deleted: { table: string; where: unknown[] }[];
  selectLimit: number | null;
  selectWhere: unknown[];
  selectOrder: unknown[];
} = {
  rows: [],
  inserted: [],
  conflict: null,
  deleted: [],
  selectLimit: null,
  selectWhere: [],
  selectOrder: [],
};

const dialect = new PgDialect();

function render(chunk: SQL) {
  return dialect.sqlToQuery(chunk);
}

const fakeDb = {
  insert: (table: typeof recentlyPlayed) => ({
    values: (values: Record<string, unknown>) => ({
      onConflictDoUpdate: async (config: {
        target: unknown[];
        set: Record<string, unknown>;
      }) => {
        state.inserted.push({ table: getTableName(table), values });
        state.conflict = config;
      },
    }),
  }),
  select: () => ({
    from: () => ({
      where: (where: SQL) => {
        state.selectWhere = render(where).params;
        return {
          orderBy: (...order: SQL[]) => {
            state.selectOrder = order.map((o) => render(o).sql);
            return {
              limit: (limit: number) => {
                state.selectLimit = limit;
                // Doubles as the `keep` subquery and the list result.
                const query = sql`(select 1)` as SQL & PromiseLike<Row[]>;
                query.then = (onFulfilled, onRejected) =>
                  Promise.resolve(state.rows).then(onFulfilled, onRejected);
                return query;
              },
            };
          },
        };
      },
    }),
  }),
  delete: (table: typeof recentlyPlayed) => ({
    where: async (where: SQL) => {
      state.deleted.push({
        table: getTableName(table),
        where: render(where).params,
      });
    },
  }),
};

mock.module("@infinitunes/db", () => ({ db: fakeDb }));

const { appRouter } = await import("../src/root");
const { createCallerFactory } = await import("../src/trpc");
const { HISTORY_LIMIT } = await import("../src/router/history");

const db = fakeDb as unknown as DbClient;
const authed = () =>
  createCallerFactory(appRouter)({ db, session: { user: { id: "user-1" } } });

describe("history router", () => {
  beforeEach(() => {
    state.rows = [];
    state.inserted = [];
    state.conflict = null;
    state.deleted = [];
    state.selectLimit = null;
    state.selectWhere = [];
    state.selectOrder = [];
  });

  it("rejects record and list without a session", async () => {
    const caller = createCallerFactory(appRouter)({ db, session: null });

    await expect(
      caller.history.record({ id: "abc", type: "song" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.history.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(state.inserted).toHaveLength(0);
    expect(state.deleted).toHaveLength(0);
  });

  it("upserts the play for the session user and bumps playedAt on replay", async () => {
    await authed().history.record({ id: "abc", type: "episode" });

    expect(state.inserted).toEqual([
      {
        table: "infinitunes_recently_played",
        values: { userId: "user-1", itemId: "abc", itemType: "episode" },
      },
    ]);
    expect(state.conflict?.target).toEqual([
      recentlyPlayed.userId,
      recentlyPlayed.itemType,
      recentlyPlayed.itemId,
    ]);
    expect(state.conflict?.set.playedAt).toBeInstanceOf(Date);
  });

  it("trims the user's history to the newest 50 after recording", async () => {
    await authed().history.record({ id: "abc", type: "song" });

    expect(HISTORY_LIMIT).toBe(50);
    expect(state.selectLimit).toBe(50);
    expect(state.selectWhere).toEqual(["user-1"]);
    expect(state.selectOrder[0]).toContain("desc");
    expect(state.deleted).toHaveLength(1);
    expect(state.deleted[0]?.table).toBe("infinitunes_recently_played");
    expect(state.deleted[0]?.where).toContain("user-1");
  });

  it("rejects an empty or oversized id before writing", async () => {
    const caller = authed();

    await expect(
      caller.history.record({ id: "", type: "song" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.history.record({ id: "x".repeat(65), type: "song" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(state.inserted).toHaveLength(0);
  });

  it("lists the session user's last 50 plays newest first", async () => {
    state.rows = [
      { id: "new", type: "song" },
      { id: "old", type: "song" },
    ];

    const result = await authed().history.list();

    expect(result).toEqual(state.rows);
    expect(state.selectWhere).toEqual(["user-1"]);
    expect(state.selectOrder[0]).toContain("desc");
    expect(state.selectLimit).toBe(50);
  });
});
