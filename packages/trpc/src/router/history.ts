import { recentlyPlayed } from "@infinitunes/db/schema";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";

export const HISTORY_LIMIT = 50;

const recordInput = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(["song", "episode"]),
});

export const historyRouter = router({
  record: protectedProcedure
    .input(recordInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db.transaction(async (tx) => {
        await tx
          .insert(recentlyPlayed)
          .values({ userId, itemId: input.id, itemType: input.type })
          .onConflictDoUpdate({
            target: [
              recentlyPlayed.userId,
              recentlyPlayed.itemType,
              recentlyPlayed.itemId,
            ],
            // Database clock, like the column's `defaultNow()`: a JS Date is sent
            // as UTC wall-clock, which skews ordering against default-stamped
            // rows when the database TimeZone is not UTC.
            set: { playedAt: sql`now()` },
          });

        const keep = tx
          .select({ id: recentlyPlayed.id })
          .from(recentlyPlayed)
          .where(eq(recentlyPlayed.userId, userId))
          .orderBy(desc(recentlyPlayed.playedAt))
          .limit(HISTORY_LIMIT);

        await tx
          .delete(recentlyPlayed)
          .where(
            and(
              eq(recentlyPlayed.userId, userId),
              notInArray(recentlyPlayed.id, keep),
            ),
          );
      });

      return { ok: true as const };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({ id: recentlyPlayed.itemId, type: recentlyPlayed.itemType })
      .from(recentlyPlayed)
      .where(eq(recentlyPlayed.userId, ctx.session.user.id))
      .orderBy(desc(recentlyPlayed.playedAt))
      .limit(HISTORY_LIMIT);
  }),
});
