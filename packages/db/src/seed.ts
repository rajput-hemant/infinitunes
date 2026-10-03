import { hash } from "bcryptjs";
import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  LOCAL_DEV_DATABASE,
  LOCAL_DEV_INFINITUNES,
  LOCAL_DEV_REDIS,
  LOCAL_DEV_USER,
} from "./fixtures/local-dev-user";
import * as schema from "./schema";
import { betterAuthAccounts, favorites, myPlaylists, users } from "./schema";

async function seed() {
  if (process.env.NODE_ENV === "production") {
    console.error("[seed] ABORTED: Cannot seed database in production mode!");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL || LOCAL_DEV_DATABASE.url;

  console.log(
    `[seed] Connecting to database: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`,
  );

  const pgClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(pgClient, { schema });

  try {
    const hashedPassword = await hash(LOCAL_DEV_USER.password, 10);

    await db.transaction(async (tx) => {
      // 1. Seed or preserve canonical shared user
      const existingUsers = await tx
        .select()
        .from(users)
        .where(
          or(
            eq(users.id, LOCAL_DEV_USER.id),
            eq(users.email, LOCAL_DEV_USER.email),
          ),
        );

      let targetUserId = LOCAL_DEV_USER.id;

      if (existingUsers.length === 0) {
        console.log(
          `[seed] Creating shared local user (${LOCAL_DEV_USER.email})...`,
        );
        const [insertedUser] = await tx
          .insert(users)
          .values({
            id: LOCAL_DEV_USER.id,
            email: LOCAL_DEV_USER.email,
            name: LOCAL_DEV_USER.name,
            username: LOCAL_DEV_USER.username,
            password: hashedPassword,
            betterAuthName: LOCAL_DEV_USER.name,
            emailVerifiedBoolean: LOCAL_DEV_USER.emailVerified,
            displayUsername: LOCAL_DEV_USER.displayUsername,
            emailVerified: new Date(),
          })
          .returning();
        targetUserId = insertedUser.id;
      } else {
        console.log(
          `[seed] User ${existingUsers[0].email} already exists; preserving existing record.`,
        );
        targetUserId = existingUsers[0].id;
      }

      // 2. Seed Better Auth credential account
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
      for (const pl of LOCAL_DEV_INFINITUNES.playlists) {
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
          id: LOCAL_DEV_INFINITUNES.favorites.id,
          userId: targetUserId,
          songs: LOCAL_DEV_INFINITUNES.favorites.songs,
          albums: LOCAL_DEV_INFINITUNES.favorites.albums,
          playlists: LOCAL_DEV_INFINITUNES.favorites.playlists,
          artists: LOCAL_DEV_INFINITUNES.favorites.artists,
          podcasts: LOCAL_DEV_INFINITUNES.favorites.podcasts,
        });
      } else {
        console.log("[seed] User favorites already exist; preserving.");
      }
    });

    // 5. Check Redis reachability (only actual required data, no fake auth)
    const redisRestUrl =
      process.env.UPSTASH_REDIS_REST_URL || LOCAL_DEV_REDIS.restUrl;
    const redisRestToken =
      process.env.UPSTASH_REDIS_REST_TOKEN || LOCAL_DEV_REDIS.restToken;

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
