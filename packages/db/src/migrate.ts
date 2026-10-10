import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = fileURLToPath(
  new URL("./migrations/", import.meta.url),
);
const journal = await Bun.file(`${migrationsFolder}/meta/_journal.json`).json();
const baseline = journal.entries[0] as { when: number };

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for migrations");

const client = postgres(url, { max: 1, onnotice: () => {} });

try {
  const [{ exists }] = await client`
    SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS exists
  `;

  if (exists) {
    const [{ legacy }] = await client`
      SELECT EXISTS (
        SELECT 1 FROM drizzle.__drizzle_migrations
        WHERE created_at < ${baseline.when}
      ) AS legacy
    `;
    if (legacy) {
      throw new Error(
        "Legacy migration history detected. Migrate this database with the previous release first before applying the current baseline and migration 0007.",
      );
    }
  }

  // The baseline only creates what is missing, so shared auth tables that
  // another application created first are reused instead of failing.
  await migrate(drizzle(client), { migrationsFolder });
} finally {
  await client.end();
}
