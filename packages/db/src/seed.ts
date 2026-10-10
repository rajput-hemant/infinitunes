import { hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";
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
  const { user: localDevUser, infinitunes: localDevInfinitunes } = fixture;

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

      // Every insert below is idempotent: existing rows are left untouched.
      await tx
        .insert(users)
        .values({
          id: localDevUser.id,
          email: localDevUser.email,
          betterAuthName: localDevUser.name,
          emailVerifiedBoolean: localDevUser.emailVerified,
        })
        .onConflictDoNothing();

      // Better Auth credential account for the canonical user only
      await tx
        .insert(betterAuthAccounts)
        .values({
          userId: targetUserId,
          providerId: "credential",
          accountId: targetUserId,
          password: hashedPassword,
        })
        .onConflictDoNothing();

      // Deterministic Infinitunes playlists
      for (const pl of localDevInfinitunes.playlists) {
        await tx
          .insert(myPlaylists)
          .values({
            id: pl.id,
            name: pl.name,
            description: pl.description,
            userId: targetUserId,
            songs: pl.songs,
          })
          .onConflictDoNothing();
      }

      // Deterministic Infinitunes favorites
      await tx
        .insert(favorites)
        .values({
          id: localDevInfinitunes.favorites.id,
          userId: targetUserId,
          songs: localDevInfinitunes.favorites.songs,
          albums: localDevInfinitunes.favorites.albums,
          playlists: localDevInfinitunes.favorites.playlists,
          artists: localDevInfinitunes.favorites.artists,
          podcasts: localDevInfinitunes.favorites.podcasts,
        })
        .onConflictDoNothing();
    });

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
