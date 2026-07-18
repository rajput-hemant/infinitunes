import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const migrationsDir = resolve(
  fileURLToPath(new URL("..", import.meta.url)),
  "src",
  "migrations",
);

describe("migration artifacts", () => {
  const sqlFiles = readdirSync(migrationsDir)
    .filter((f: string) => f.endsWith(".sql"))
    .sort();

  it("has exactly 8 migration SQL files (0000-0007)", () => {
    expect(sqlFiles).toHaveLength(8);
    expect(sqlFiles[0]).toBe("0000_fresh_psynapse.sql");
    expect(sqlFiles[7]).toBe("0007_better_auth_foundation.sql");
  });

  it("0007 adds Better Auth compatibility columns to user", () => {
    const content = readFileSync(
      join(migrationsDir, "0007_better_auth_foundation.sql"),
      "utf-8",
    );

    expect(content).toContain('ALTER TABLE "user" ADD COLUMN "betterAuthName"');
    expect(content).toContain(
      'ALTER TABLE "user" ADD COLUMN "emailVerifiedBoolean"',
    );
    expect(content).toContain(
      'ALTER TABLE "user" ADD COLUMN "displayUsername"',
    );
    expect(content).toContain('ALTER TABLE "user" ADD COLUMN "createdAt"');
    expect(content).toContain('ALTER TABLE "user" ADD COLUMN "updatedAt"');
    expect(content).toContain(
      'ALTER TABLE "user" ADD COLUMN "emailVerifiedBoolean" boolean DEFAULT false NOT NULL',
    );
  });

  it("0007 does NOT add admin plugin columns", () => {
    const content = readFileSync(
      join(migrationsDir, "0007_better_auth_foundation.sql"),
      "utf-8",
    );

    expect(content).not.toContain('ADD COLUMN "role"');
    expect(content).not.toContain('ADD COLUMN "banned"');
    expect(content).not.toContain('ADD COLUMN "banReason"');
    expect(content).not.toContain('ADD COLUMN "banExpires"');
  });

  it("0007 creates better_auth tables", () => {
    const content = readFileSync(
      join(migrationsDir, "0007_better_auth_foundation.sql"),
      "utf-8",
    );

    expect(content).toContain(
      'CREATE TABLE IF NOT EXISTS "better_auth_account"',
    );
    expect(content).toContain(
      'CREATE TABLE IF NOT EXISTS "better_auth_session"',
    );
    expect(content).toContain(
      'CREATE TABLE IF NOT EXISTS "better_auth_verification"',
    );

    expect(content).toContain("better_auth_account_userId_user_id_fk");
    expect(content).toContain("better_auth_session_userId_user_id_fk");
  });

  it("0007 creates unique index on better_auth_account (providerId, accountId)", () => {
    const content = readFileSync(
      join(migrationsDir, "0007_better_auth_foundation.sql"),
      "utf-8",
    );

    expect(content).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "better_auth_account_provider_account_unique"',
    );
  });

  it("0007 creates unique index on better_auth_session token", () => {
    const content = readFileSync(
      join(migrationsDir, "0007_better_auth_foundation.sql"),
      "utf-8",
    );

    expect(content).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "better_auth_session_token_unique"',
    );
  });
});

describe("journal", () => {
  it("includes the 0007 entry", () => {
    const journal = JSON.parse(
      readFileSync(join(migrationsDir, "meta", "_journal.json"), "utf-8"),
    ) as { entries: { idx: number; tag: string; breakpoints: boolean }[] };

    const entry = journal.entries.find(
      (e) => e.tag === "0007_better_auth_foundation",
    );
    expect(entry).toBeDefined();
    expect(entry!.idx).toBe(7);
    expect(entry!.breakpoints).toBe(true);
  });
});
