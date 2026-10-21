import { describe, expect, it } from "bun:test";

import { createClient } from "@infinitunes/db/client";
import { migrationsFolder } from "@infinitunes/db/migrations";
import { myPlaylists, users } from "@infinitunes/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { appRouter } from "../src/root";
import { PLAYLIST_MAX_COUNT } from "../src/router/user";
import { createCallerFactory } from "../src/trpc";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("createNewPlaylist concurrency", () => {
  it("holds the cap when creates race (a double tap, phone and web)", async () => {
    if (!url) throw new Error("TEST_DATABASE_URL is required");

    const db = createClient(url);
    await migrate(db, { migrationsFolder });
    const [user] = await db
      .insert(users)
      .values({ email: `cap-race-${Date.now()}-${Math.random()}@example.com` })
      .returning();
    if (!user) throw new Error("fixture user insert failed");
    const caller = createCallerFactory(appRouter)({
      db,
      session: { user: { id: user.id } },
    });

    const outcomes = await Promise.allSettled(
      Array.from({ length: PLAYLIST_MAX_COUNT + 2 }, (_, i) =>
        caller.user.createNewPlaylist({ name: `Race ${i}` }),
      ),
    );

    const owned = await db
      .select({ id: myPlaylists.id })
      .from(myPlaylists)
      .where(eq(myPlaylists.userId, user.id));
    expect(owned).toHaveLength(PLAYLIST_MAX_COUNT);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(
      PLAYLIST_MAX_COUNT,
    );
    expect(
      outcomes.filter(
        (o) => o.status === "rejected" && o.reason?.code === "BAD_REQUEST",
      ),
    ).toHaveLength(2);

    await db.delete(users).where(eq(users.id, user.id));
  });
});
