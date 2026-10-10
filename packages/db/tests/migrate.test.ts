import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const url = process.env.TEST_MIGRATION_DATABASE_URL;
const folder = fileURLToPath(new URL("../src/migrations/", import.meta.url));

// Use only a disposable database: these tests create and drop their own databases.
test.skipIf(!url)(
  "legacy removal preserves unmirrored data and rejects old history",
  async () => {
    const admin = postgres(url!, { max: 1, onnotice: () => {} });
    const journal = await Bun.file(`${folder}/meta/_journal.json`).json();
    const removal = await Bun.file(`${folder}/0007_empty_banshee.sql`).text();
    const userId = "a0000000-0000-4000-8000-000000000001";

    try {
      for (const scenario of [
        "empty",
        "password",
        "account",
        "token",
        "mirrored",
        "history",
      ]) {
        const database = `legacy_guard_${scenario}_${process.pid}`;
        await admin.unsafe(`CREATE DATABASE "${database}"`);
        const testUrl = new URL(url!);
        testUrl.pathname = `/${database}`;
        const client = postgres(testUrl.toString(), {
          max: 1,
          onnotice: () => {},
        });
        try {
          for (const entry of journal.entries.slice(0, 7)) {
            const sql = await Bun.file(`${folder}/${entry.tag}.sql`).text();
            await client.unsafe(sql.replaceAll("--> statement-breakpoint", ""));
          }
          if (scenario !== "empty" && scenario !== "history") {
            await client`INSERT INTO "user" (id, email, password) VALUES (${userId}, 'guard@example.test', 'hash')`;
          }
          if (scenario === "account" || scenario === "mirrored") {
            await client`INSERT INTO account ("userId", type, provider, "providerAccountId") VALUES (${userId}, 'oauth', 'google', 'google-id')`;
          }
          if (scenario === "token" || scenario === "mirrored") {
            await client`INSERT INTO "verificationToken" (identifier, token, expires) VALUES ('email', 'token', '2030-01-01')`;
          }
          if (["account", "token", "mirrored"].includes(scenario)) {
            await client`INSERT INTO better_auth_account ("userId", "accountId", "providerId", password) VALUES (${userId}, ${userId}, 'credential', 'hash')`;
          }
          if (scenario === "mirrored") {
            await client`INSERT INTO better_auth_account ("userId", "accountId", "providerId") VALUES (${userId}, 'google-id', 'google')`;
            await client`INSERT INTO better_auth_verification (identifier, value, "expiresAt") VALUES ('email', 'token', '2030-01-01')`;
          }
          if (scenario === "history") {
            await client.unsafe(
              `CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint); INSERT INTO drizzle.__drizzle_migrations (hash, created_at) SELECT 'legacy-' || n, n FROM generate_series(1, 8) n;`,
            );
            const result = Bun.spawnSync(
              [
                "bun",
                fileURLToPath(new URL("../src/migrate.ts", import.meta.url)),
              ],
              {
                env: { ...process.env, DATABASE_URL: testUrl.toString() },
              },
            );
            expect(result.exitCode).not.toBe(0);
            expect(result.stderr.toString()).toContain(
              "Migrate this database with the previous release first",
            );
          } else if (["password", "account", "token"].includes(scenario)) {
            await expect(
              client.begin(async (tx) => {
                await tx.unsafe(
                  removal.replaceAll("--> statement-breakpoint", ""),
                );
              }),
            ).rejects.toThrow(
              `Migration 0007 blocked: legacy ${scenario === "password" ? "user passwords" : scenario === "account" ? "accounts" : "verification tokens"}`,
            );
            const [row] =
              await client`SELECT password FROM "user" WHERE id = ${userId}`;
            expect(row.password).toBe("hash");
            const [tables] =
              await client`SELECT to_regclass('public.account') IS NOT NULL AND to_regclass('public."verificationToken"') IS NOT NULL AS retained`;
            expect(tables.retained).toBe(true);
          } else {
            await client.unsafe(
              removal.replaceAll("--> statement-breakpoint", ""),
            );
            await client.unsafe(
              removal.replaceAll("--> statement-breakpoint", ""),
            );
            const [row] =
              await client`SELECT to_regclass('public.account') IS NULL AS removed`;
            expect(row.removed).toBe(true);
          }
          console.log(`Migration guard: ${scenario} passed`);
        } finally {
          await client.end();
          await admin.unsafe(`DROP DATABASE "${database}"`);
        }
      }
    } finally {
      await admin.end();
    }
  },
  30000,
);
