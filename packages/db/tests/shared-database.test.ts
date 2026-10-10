import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const url = process.env.TEST_MIGRATION_DATABASE_URL;
const script = (name: string) =>
  fileURLToPath(new URL(`../src/${name}.ts`, import.meta.url));

const userId = "a0000000-0000-4000-8000-000000000001";

// The shared auth tables as a sibling app creates them, plus one app-owned table.
const siblingTables = `
  CREATE TABLE "user" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text,
    "email" text NOT NULL,
    "password" text,
    "image" text,
    "betterAuthName" text DEFAULT '' NOT NULL,
    "emailVerifiedBoolean" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "user_email_unique" UNIQUE("email")
  );
  CREATE TABLE "better_auth_account" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "idToken" text,
    "password" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );
  CREATE UNIQUE INDEX "better_auth_account_provider_account_unique" ON "better_auth_account" ("providerId", "accountId");
  CREATE TABLE "better_auth_session" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL REFERENCES "user"("id") ON DELETE cascade,
    "token" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "better_auth_session_token_unique" UNIQUE("token")
  );
  CREATE TABLE "better_auth_verification" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
  );
  CREATE TABLE "lipi_workspace" ("id" uuid PRIMARY KEY, "name" text NOT NULL);
  INSERT INTO "lipi_workspace" VALUES (gen_random_uuid(), 'sibling workspace');
  CREATE SCHEMA IF NOT EXISTS drizzle;
  CREATE TABLE drizzle.__lipi_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);
  INSERT INTO drizzle.__lipi_migrations (hash, created_at) VALUES ('sibling', 1);
`;

function run(name: string, databaseUrl: string) {
  const result = Bun.spawnSync(["bun", script(name)], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  if (result.exitCode !== 0) {
    throw new Error(`${name} failed: ${result.stderr.toString()}`);
  }
}

// Use only a disposable database: this test creates and drops its own.
test.skipIf(!url)(
  "migrate and seed twice on a database a sibling app created first",
  async () => {
    const admin = postgres(url!, { max: 1, onnotice: () => {} });
    const database = `shared_seed_${process.pid}`;
    await admin.unsafe(`CREATE DATABASE "${database}"`);
    const testUrl = new URL(url!);
    testUrl.pathname = `/${database}`;
    const client = postgres(testUrl.toString(), {
      max: 1,
      onnotice: () => {},
    });

    try {
      await client.unsafe(siblingTables);
      await client`INSERT INTO "user" (id, name, email, password, "betterAuthName", "emailVerifiedBoolean")
        VALUES (${userId}, 'Local Developer', 'local@example.test', 'sibling-hash', 'Local Developer', true)`;
      await client`INSERT INTO "better_auth_account" ("userId", "accountId", "providerId", password)
        VALUES (${userId}, ${userId}, 'credential', 'sibling-hash')`;

      for (let pass = 0; pass < 2; pass++) {
        run("migrate", testUrl.toString());
        run("seed", testUrl.toString());
      }

      const count = async (table: string) =>
        (await client.unsafe(`SELECT count(*)::int AS n FROM ${table}`))[0].n;
      expect(await count('"user"')).toBe(1);
      expect(await count('"better_auth_account"')).toBe(1);
      expect(await count("infinitunes_playlist")).toBe(2);
      expect(await count("infinitunes_favorite")).toBe(1);
      expect(await count("infinitunes_recently_played")).toBe(3);

      const [user] =
        await client`SELECT name, password FROM "user" WHERE id = ${userId}`;
      expect(user).toEqual({
        name: "Local Developer",
        password: "sibling-hash",
      });

      const [account] =
        await client`SELECT password FROM "better_auth_account" WHERE "userId" = ${userId}`;
      expect(account.password).toBe("sibling-hash");

      expect(await count('"lipi_workspace"')).toBe(1);
      expect(await count("drizzle.__lipi_migrations")).toBe(1);
      expect(await count("drizzle.__drizzle_migrations")).toBe(9);

      const [{ foreign }] = await client`
        SELECT count(*)::int AS foreign FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name LIKE 'lipi_%'`;
      expect(foreign).toBe(1);
    } finally {
      await client.end();
      await admin.unsafe(`DROP DATABASE "${database}"`);
      await admin.end();
    }
  },
  60000,
);
