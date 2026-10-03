import { hash } from "bcryptjs";
import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getLocalDevFixture } from "./fixtures/local-dev-user";
import { assertLocalDatabase } from "./fixtures/local-guard";
import * as schema from "./schema";
import { betterAuthAccounts, favorites, myPlaylists, users } from "./schema";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "[seed] DATABASE_URL is required. Copy .env.example to .env and run `bun run db:up` first.",
    );
  }

  assertLocalDatabase(databaseUrl);

  const fixture = getLocalDevFixture();
  const {
    user: localDevUser,
    infinitunes: localDevInfinitunes,
    redis: localDevRedis,
  } = fixture;

  console.log(
    `[seed] Connecting to database: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`,
  );

  const pgClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(pgClient, { schema });

  try {
    const hashedPassword = await hash(localDevUser.password, 10);

    await db.transaction(async (tx) => {
      // 1. Seed the canonical shared user; never adopt a different account
      const existingUsers = await tx
        .select()
        .from(users)
        .where(
          or(
            eq(users.id, localDevUser.id),
            eq(users.email, localDevUser.email),
          ),
        );

      for (const existing of existingUsers) {
        if (
          existing.id !== localDevUser.id ||
          existing.email !== localDevUser.email
        ) {
          throw new Error(
            `[seed] Refusing to seed: fixture id/email collides with a different user (id ${existing.id}, email ${existing.email}).`,
          );
        }
      }

      const targetUserId = localDevUser.id;

      if (existingUsers.length === 0) {
        console.log(
          `[seed] Creating shared local user (${localDevUser.email})...`,
        );
        await tx.insert(users).values({
          id: localDevUser.id,
          email: localDevUser.email,
          name: localDevUser.name,
          password: hashedPassword,
          betterAuthName: localDevUser.name,
          emailVerifiedBoolean: localDevUser.emailVerified,
          emailVerified: new Date(),
        });
      } else {
        console.log("[seed] Canonical local user already exists; preserving.");
      }

      // 2. Seed the Better Auth credential account for the canonical user only
      const existingAccounts = await tx
        .select()
        .from(betterAuthAccounts)
        .where(
          and(
            eq(betterAuthAccounts.userId, targetUserId),
            eq(betterAuthAccounts.providerId, "credential"),
          ),
        );

      if (existingAccounts.length === 0) {
        console.log(
          `[seed] Creating Better Auth credential account for user ${targetUserId}...`,
        );
        await tx.insert(betterAuthAccounts).values({
          userId: targetUserId,
          providerId: "credential",
          accountId: targetUserId,
          password: hashedPassword,
        });
      } else {
        console.log(
          "[seed] Better Auth credential account already exists; preserving existing record.",
        );
      }

      // 3. Seed deterministic Infinitunes playlists
      for (const pl of localDevInfinitunes.playlists) {
        const existingPl = await tx
          .select()
          .from(myPlaylists)
          .where(eq(myPlaylists.id, pl.id));

        if (existingPl.length === 0) {
          console.log(`[seed] Creating deterministic playlist: ${pl.name}...`);
          await tx.insert(myPlaylists).values({
            id: pl.id,
            name: pl.name,
            description: pl.description,
            userId: targetUserId,
            songs: pl.songs,
          });
        } else {
          console.log(`[seed] Playlist ${pl.id} already exists; preserving.`);
        }
      }

      // 4. Seed deterministic Infinitunes favorites
      const existingFav = await tx
        .select()
        .from(favorites)
        .where(eq(favorites.userId, targetUserId));

      if (existingFav.length === 0) {
        console.log(
          `[seed] Creating deterministic favorites for user ${targetUserId}...`,
        );
        await tx.insert(favorites).values({
          id: localDevInfinitunes.favorites.id,
          userId: targetUserId,
          songs: localDevInfinitunes.favorites.songs,
          albums: localDevInfinitunes.favorites.albums,
          playlists: localDevInfinitunes.favorites.playlists,
          artists: localDevInfinitunes.favorites.artists,
          podcasts: localDevInfinitunes.favorites.podcasts,
        });
      } else {
        console.log("[seed] User favorites already exist; preserving.");
      }
    });

    // 5. Check Redis reachability (only actual required data, no fake auth)
    const redisRestUrl =
      process.env.UPSTASH_REDIS_REST_URL || localDevRedis.restUrl;
    const redisRestToken =
      process.env.UPSTASH_REDIS_REST_TOKEN || localDevRedis.restToken;

    if (redisRestUrl) {
      try {
        const res = await fetch(redisRestUrl, {
          headers: {
            Authorization: `Bearer ${redisRestToken}`,
          },
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          console.log(
            `[seed] Redis REST adapter verified reachable at ${redisRestUrl}`,
          );
        } else {
          console.log(
            `[seed] Redis REST adapter ping returned status: ${res.status}`,
          );
        }
      } catch {
        console.log(
          `[seed] Notice: Redis REST adapter at ${redisRestUrl} was not reached (service may not be running).`,
        );
      }
    }

    console.log("[seed] Seeding successfully completed.");
  } finally {
    await pgClient.end();
  }
}

if (import.meta.main) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("[seed] Error seeding database:", err);
      process.exit(1);
    });
}
