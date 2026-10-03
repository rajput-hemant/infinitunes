import { describe, expect, it } from "bun:test";

import { createClient } from "@infinitunes/db/client";
import { migrationsFolder } from "@infinitunes/db/migrations";
import { favorites, users } from "@infinitunes/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { appRouter } from "../src/root";
import { createCallerFactory } from "../src/trpc";

const url = process.env.TEST_DATABASE_URL;

async function createUserWithCaller(db: ReturnType<typeof createClient>) {
  const [user] = await db
    .insert(users)
    .values({ email: `fav-race-${Date.now()}-${Math.random()}@example.com` })
    .returning();
  if (!user) throw new Error("fixture user insert failed");

  const caller = createCallerFactory(appRouter)({
    db,
    session: { user: { id: user.id } },
  });

  return { caller, userId: user.id };
}

async function readSongs(db: ReturnType<typeof createClient>, userId: string) {
  const row = await db.query.favorites.findFirst({
    where: eq(favorites.userId, userId),
  });
  return row?.songs ?? [];
}

describe.skipIf(!url)("addToFavorites concurrency", () => {
  it("stores both items when two first favourites race", async () => {
    if (!url) throw new Error("TEST_DATABASE_URL is required");

    const db = createClient(url);
    await migrate(db, { migrationsFolder });
    const { caller, userId } = await createUserWithCaller(db);

    const [first, second] = await Promise.all([
      caller.user.addToFavorites({ token: "song-a", type: "song" }),
      caller.user.addToFavorites({ token: "song-b", type: "song" }),
    ]);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);

    expect([...(await readSongs(db, userId))].sort()).toEqual([
      "song-a",
      "song-b",
    ]);

    await caller.user.removeFromFavorites({ token: "song-a", type: "song" });
    expect(await readSongs(db, userId)).toEqual(["song-b"]);
  });

  it("stores one token when two same-item first favourites race", async () => {
    if (!url) throw new Error("TEST_DATABASE_URL is required");

    const db = createClient(url);
    await migrate(db, { migrationsFolder });
    const { caller, userId } = await createUserWithCaller(db);

    const [first, second] = await Promise.all([
      caller.user.addToFavorites({ token: "song-same", type: "song" }),
      caller.user.addToFavorites({ token: "song-same", type: "song" }),
    ]);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);

    expect(await readSongs(db, userId)).toEqual(["song-same"]);

    await caller.user.addToFavorites({ token: "song-same", type: "song" });
    expect(await readSongs(db, userId)).toEqual(["song-same"]);
  });

  it("legacy find-then-insert loses the race under a controlled interleaving", async () => {
    if (!url) throw new Error("TEST_DATABASE_URL is required");

    const db = createClient(url);
    await migrate(db, { migrationsFolder });
    const { userId } = await createUserWithCaller(db);

    let reads = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    async function legacyAdd(token: string) {
      const existing = await db.query.favorites.findFirst({
        where: eq(favorites.userId, userId),
      });
      reads += 1;
      if (reads === 2) release();
      await gate;
      if (!existing) {
        return db
          .insert(favorites)
          .values({ userId, songs: [token] })
          .returning();
      }
      return [];
    }

    const outcomes = await Promise.allSettled([
      legacyAdd("song-a"),
      legacyAdd("song-b"),
    ]);
    expect(reads).toBe(2);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === "rejected")).toHaveLength(1);
  });
});
