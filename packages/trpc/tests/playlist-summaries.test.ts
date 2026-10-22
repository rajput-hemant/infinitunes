import { expect, it } from "bun:test";

import type { DbClient } from "@infinitunes/db/client";
import * as schema from "@infinitunes/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";

import { userRouter } from "../src/router/user";
import { createCallerFactory } from "../src/trpc";

it("projects playlist summaries in SQL and restricts them to the viewer", async () => {
  const sqlDb = drizzle.mock({ schema });
  let query: { sql: string; params: unknown[] } | undefined;
  const db = {
    query: {
      myPlaylists: {
        findMany(
          options: Parameters<typeof sqlDb.query.myPlaylists.findMany>[0],
        ) {
          query = sqlDb.query.myPlaylists.findMany(options).toSQL();
          return Promise.resolve([]);
        },
      },
    },
  } as unknown as DbClient;
  const caller = createCallerFactory(userRouter)({
    db,
    session: { user: { id: "viewer" } },
  });
  expect(await caller.getUserPlaylists()).toEqual([]);
  expect(query?.sql).toContain('cardinality("songs")');
  expect(query?.sql).toContain('"songs"[1:4]');
  expect(query?.sql).not.toMatch(/select[^]*, "songs",/);
  expect(query?.sql).not.toMatch(/select[^]*, "userId",/);
  expect(query?.params).toEqual(["viewer"]);
});
