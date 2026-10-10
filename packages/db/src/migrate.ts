import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = fileURLToPath(
  new URL("./migrations/", import.meta.url),
);
const journal = await Bun.file(`${migrationsFolder}/meta/_journal.json`).json();
const baseline = journal.entries[0] as { tag: string; when: number };
const baselineSql = await Bun.file(
  `${migrationsFolder}/${baseline.tag}.sql`,
).text();
const baselineHash = createHash("sha256").update(baselineSql).digest("hex");

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for migrations");

const client = postgres(url, { max: 1, onnotice: () => {} });

/**
 * Fresh Infinitunes history: apply the baseline so that shared tables another
 * application already created in the same database (`user`, `better_auth_*`)
 * are reused instead of failing, then record it so the migrator skips it.
 */
async function applyBaselineIdempotently() {
  const statements = baselineSql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim().replace(/;$/, ""))
    .filter(Boolean)
    .map((statement) => {
      if (
        statement.startsWith("ALTER TABLE") &&
        statement.includes("ADD CONSTRAINT")
      ) {
        return `DO $$ BEGIN ${statement}; EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`;
      }
      return statement
        .replace(/^CREATE TABLE /, "CREATE TABLE IF NOT EXISTS ")
        .replace(/^CREATE UNIQUE INDEX /, "CREATE UNIQUE INDEX IF NOT EXISTS ");
    });

  await client.begin(async (tx) => {
    await tx`CREATE SCHEMA IF NOT EXISTS drizzle`;
    await tx`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint
      )
    `;
    for (const statement of statements) await tx.unsafe(statement);
    await tx`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${baselineHash}, ${baseline.when})
    `;
  });
}

try {
  const [{ exists }] = await client`
    SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists
  `;

  const [{ rowCount }] = exists
    ? await client`SELECT count(*)::int AS "rowCount" FROM drizzle.__drizzle_migrations`
    : [{ rowCount: 0 }];

  if (rowCount === 0) {
    await applyBaselineIdempotently();
  }

  await migrate(drizzle(client), { migrationsFolder });
} finally {
  await client.end();
}
