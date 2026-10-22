import { describe, expect, it } from "bun:test";

import { createClient } from "@infinitunes/db/client";
import { migrationsFolder } from "@infinitunes/db/migrations";
import { recentlyPlayed, users } from "@infinitunes/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { appRouter } from "../src/root";
import { HISTORY_LIMIT } from "../src/router/history";
import { createCallerFactory } from "../src/trpc";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("history concurrency", () => {
  it("keeps at most 50 stored rows when devices record different songs together", async () => {
    if (!url) throw new Error("TEST_DATABASE_URL is required");
    // createClient has a one-connection pool, so devices need separate clients to race.
    const devices = [createClient(url), createClient(url)];
    const db = devices[0]!;
    let userId: string | undefined;
    try {
      await migrate(db, { migrationsFolder });
      const [user] = await db
        .insert(users)
        .values({
          email: `history-race-${crypto.randomUUID()}@example.test`,
        })
        .returning();
      if (!user) throw new Error("fixture user insert failed");
      userId = user.id;
      await db.insert(recentlyPlayed).values(
        Array.from({ length: HISTORY_LIMIT - 1 }, (_, i) => ({
          userId: user.id,
          itemId: `old-${i}`,
          itemType: "song" as const,
          playedAt: new Date("2000-01-01"),
        })),
      );
      const callers = devices.map((device) =>
        createCallerFactory(appRouter)({
          db: device,
          session: { user: { id: user.id } },
        }),
      );

      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          callers[i % callers.length]!.history.record({
            id: `new-${i}`,
            type: "song",
          }),
        ),
      );

      const rows = await db
        .select({ id: recentlyPlayed.itemId })
        .from(recentlyPlayed)
        .where(eq(recentlyPlayed.userId, user.id));
      expect(rows).toHaveLength(HISTORY_LIMIT);
      expect(rows.filter((row) => row.id.startsWith("new-"))).toHaveLength(20);
    } finally {
      try {
        if (userId) await db.delete(users).where(eq(users.id, userId));
      } finally {
        await Promise.all(devices.map((device) => device.$client.end()));
      }
    }
  }, 30000);
});
