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

const legacyTimes = [
  1698282403085, 1698327852024, 1712002508571, 1712069367580, 1712405722387,
  1713508723922, 1727934796540, 1728000000000,
];
const legacyLastHash =
  "40ef9ebdbefd70fc8e4e9c68bcf8ec351080476734dc41af846dc1e150eafbbf";

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
  } else {
    await client.begin(async (tx) => {
      await tx`LOCK TABLE drizzle.__drizzle_migrations IN EXCLUSIVE MODE`;
      const rows = await tx`
        SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at
      `;
      const hasBaseline = rows.some(
        (row) =>
          Number(row.created_at) === baseline.when && row.hash === baselineHash,
      );

      if (!hasBaseline) {
        const isLegacy =
          rows.length === legacyTimes.length &&
          rows.every((row, i) => Number(row.created_at) === legacyTimes[i]) &&
          rows.at(-1)?.hash === legacyLastHash;
        if (!isLegacy) {
          throw new Error(
            "Unrecognized migration history; baseline was not adopted",
          );
        }

        const [{ tableCount }] = await tx`
          SELECT count(*)::int AS "tableCount" FROM pg_class
          WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'
            AND relname IN (
              'account', 'better_auth_account', 'better_auth_session',
              'better_auth_verification', 'infinitunes_favorite',
              'infinitunes_playlist', 'user', 'verificationToken'
            )
        `;
        if (tableCount !== 8) {
          throw new Error(
            "Legacy tables are incomplete; baseline was not adopted",
          );
        }

        const [{ favoriteConstraints }] = await tx`
          SELECT count(*)::int AS "favoriteConstraints" FROM pg_constraint
          WHERE conrelid = 'public.infinitunes_favorite'::regclass
            AND contype = 'u'
            AND conname IN (
              'infinitunes_favorite_songs_unique',
              'infinitunes_favorite_albums_unique',
              'infinitunes_favorite_playlists_unique',
              'infinitunes_favorite_artists_unique',
              'infinitunes_favorite_podcasts_unique'
            )
        `;
        if (favoriteConstraints !== 5) {
          throw new Error("Legacy favourite constraints do not match baseline");
        }

        const [{ tokenConstraint, tokenIndex }] = await tx`
          SELECT
            EXISTS (
              SELECT 1 FROM pg_constraint
              WHERE conrelid = 'public.better_auth_session'::regclass
                AND conname = 'better_auth_session_token_unique'
            ) AS "tokenConstraint",
            to_regclass('public.better_auth_session_token_unique') IS NOT NULL AS "tokenIndex"
        `;
        if (!tokenConstraint && !tokenIndex) {
          throw new Error("Legacy session token uniqueness is missing");
        }
        if (!tokenConstraint) {
          await tx`
            ALTER TABLE better_auth_session
            ADD CONSTRAINT better_auth_session_token_unique
            UNIQUE USING INDEX better_auth_session_token_unique
          `;
        }

        await tx`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (${baselineHash}, ${baseline.when})
        `;
      }
    });
  }

  await migrate(drizzle(client), { migrationsFolder });
} finally {
  await client.end();
}
