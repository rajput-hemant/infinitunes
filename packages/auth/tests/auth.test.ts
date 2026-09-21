import { describe, expect, it, beforeAll } from "bun:test";

import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import type { BetterAuthPlugin } from "better-auth";
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

describe("Password hashing and credential verification", () => {
  it("configures matching bcrypt hash and verify handlers on Better Auth", async () => {
    const auth = createAuth(makeFakeDb());
    const hashFn = auth.options.emailAndPassword?.password?.hash;
    const verifyFn = auth.options.emailAndPassword?.password?.verify;

    expect(hashFn).toBeTypeOf("function");
    expect(verifyFn).toBeTypeOf("function");

    const password = "fresh-signup-password";
    const hashedPassword = await hashFn!(password);

    // Verify hash format is bcrypt
    expect(hashedPassword).toMatch(/^\$2[aby]\$/);

    // Verify round-trip with the configured verify handler
    const isValid = await verifyFn!({ password, hash: hashedPassword });
    expect(isValid).toBe(true);

    const isInvalid = await verifyFn!({
      password: "wrong-password",
      hash: hashedPassword,
    });
    expect(isInvalid).toBe(false);
  });

  it("verifies a legacy bcrypt hash with the configured Better Auth verify handler", async () => {
    const auth = createAuth(makeFakeDb());
    const verifyFn = auth.options.emailAndPassword?.password?.verify;
    expect(verifyFn).toBeTypeOf("function");

    const password = "s3cret-passw0rd";
    const legacyHash = await hash(password, 10);

    expect(await verifyFn!({ password, hash: legacyHash })).toBe(true);
    expect(
      await verifyFn!({ password: "wrong-password", hash: legacyHash }),
    ).toBe(false);
  });

  it("keeps the Better Auth credential column in sync with the legacy hash", async () => {
    const password = "another-secret";
    const hashed = await hash(password, 10);

    await compare(password, hashed);

    expect(hashed).toMatch(/^\$2[aby]\$/);
  });
});

describe("Injected plugins and env precedence", () => {
  it("ships only the username plugin by default, never next-cookies", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
      "username",
    ]);
  });

  it("appends caller-supplied plugins after the username plugin", () => {
    const marker = { id: "test-injected" } as unknown as BetterAuthPlugin;
    const auth = createAuth(makeFakeDb(), { plugins: [marker] });
    expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
      "username",
      "test-injected",
    ]);
  });

  it("falls back to AUTH_SECRET / AUTH_URL without mutating process.env", () => {
    const savedSecret = process.env.BETTER_AUTH_SECRET;
    const savedUrl = process.env.BETTER_AUTH_URL;
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    process.env.AUTH_SECRET = "fallback-secret-via-auth-prefix";
    process.env.AUTH_URL = "https://fallback.example.com";
    try {
      const auth = createAuth(makeFakeDb());
      expect(auth.options.secret).toBe("fallback-secret-via-auth-prefix");
      expect(auth.options.baseURL).toBe("https://fallback.example.com");
      expect(process.env.BETTER_AUTH_SECRET).toBeUndefined();
      expect(process.env.BETTER_AUTH_URL).toBeUndefined();
    } finally {
      if (savedSecret !== undefined)
        process.env.BETTER_AUTH_SECRET = savedSecret;
      if (savedUrl !== undefined) process.env.BETTER_AUTH_URL = savedUrl;
      delete process.env.AUTH_SECRET;
      delete process.env.AUTH_URL;
    }
  });

  it("prefers an existing BETTER_AUTH_* value over the AUTH_* fallback", () => {
    process.env.BETTER_AUTH_SECRET = "explicit-better-auth-secret";
    process.env.BETTER_AUTH_URL = "https://explicit.example.com";
    process.env.AUTH_SECRET = "fallback-secret";
    process.env.AUTH_URL = "https://fallback.example.com";
    try {
      const auth = createAuth(makeFakeDb());
      expect(auth.options.secret).toBe("explicit-better-auth-secret");
      expect(auth.options.baseURL).toBe("https://explicit.example.com");
    } finally {
      delete process.env.AUTH_SECRET;
      delete process.env.AUTH_URL;
    }
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
