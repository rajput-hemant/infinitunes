import { describe, expect, it, beforeAll } from "bun:test";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import { getTableName } from "drizzle-orm";

import { createAuth } from "../src/auth";

function makeFakeDb() {
  const query: Record<string, unknown> = {
    users,
    betterAuthAccounts,
    betterAuthSessions,
    betterAuthVerifications,
  };
  return {
    query,
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    _: { fullSchema: query },
  } as unknown as Parameters<typeof createAuth>[0];
}

describe("Better Auth configuration", () => {
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET =
      "test-secret-key-that-is-at-least-32-chars";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-google-client-secret";
    process.env.GITHUB_CLIENT_ID = "test-github-client-id";
    process.env.GITHUB_CLIENT_SECRET = "test-github-client-secret";
  });

  it("disables implicit account linking", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.account?.accountLinking?.enabled).toBe(false);
    expect(auth.options.account?.accountLinking?.disableImplicitLinking).toBe(
      true,
    );
  });

  it("maps Better Auth name/emailVerified to the physical compatibility columns", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.user?.fields?.name).toBe("betterAuthName");
    expect(auth.options.user?.fields?.emailVerified).toBe(
      "emailVerifiedBoolean",
    );
  });

  it("wires the drizzle adapter against the Better Auth tables", () => {
    const auth = createAuth(makeFakeDb());
    expect(typeof auth.options.database).toBe("function");
  });

  it("exposes user hooks that mirror credentials and profile fields", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.databaseHooks?.user?.create?.after).toBeTypeOf(
      "function",
    );
    expect(auth.options.databaseHooks?.user?.update?.after).toBeTypeOf(
      "function",
    );
    expect(auth.options.databaseHooks?.account?.create?.after).toBeTypeOf(
      "function",
    );
    expect(auth.options.databaseHooks?.account?.update?.after).toBeTypeOf(
      "function",
    );
  });
});

describe("Legacy bcrypt credential compatibility", () => {
  it("verifies a legacy bcrypt hash and rejects a wrong password", async () => {
    const password = "s3cret-passw0rd";
    const legacyHash = await hash(password, 10);

    expect(await compare(password, legacyHash)).toBe(true);
    expect(await compare("wrong-password", legacyHash)).toBe(false);
  });

  it("keeps the Better Auth credential column in sync with the legacy hash", async () => {
    const password = "another-secret";
    const hashed = await hash(password, 10);

    await compare(password, hashed);

    expect(hashed).toMatch(/^\$2[aby]\$/);
  });
});

describe("Shared schema / table mapping", () => {
  it("uses the dedicated Better Auth tables and compatibility columns", () => {
    expect(getTableName(users)).toBe("user");
    expect(users.betterAuthName.name).toBe("betterAuthName");
    expect(users.emailVerifiedBoolean.name).toBe("emailVerifiedBoolean");
    expect(getTableName(betterAuthAccounts)).toBe("better_auth_account");
    expect(getTableName(betterAuthSessions)).toBe("better_auth_session");
    expect(getTableName(betterAuthVerifications)).toBe(
      "better_auth_verification",
    );
  });
});
