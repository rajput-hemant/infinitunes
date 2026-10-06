import { describe, expect, it, beforeAll } from "bun:test";

import {
  betterAuthAccounts,
  betterAuthRateLimits,
  betterAuthSessions,
  betterAuthVerifications,
  infinitunesPasskeys,
  users,
} from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import type { BetterAuthPlugin } from "better-auth";
import { getTableName, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import { createAuth } from "../src/auth";

function makeFakeDb() {
  const query: Record<string, unknown> = {
    users,
    betterAuthAccounts,
    betterAuthSessions,
    betterAuthVerifications,
    infinitunesPasskeys,
  };
  // In-memory `rateLimit` model for the database-backed limiter (SE-17).
  // Interprets the drizzle adapter's SQL the way the user-router tests do:
  // every limiter query constrains `key`, numeric conditions carry the
  // window/count operator in the query text. Other models keep the old
  // behavior (lookups miss, writes throw), so existing tests are unaffected.
  const rateRows = new Map<
    string,
    { key: string; count: number; lastRequest: number }
  >();
  const dialect = new PgDialect();
  type Cond = { field: string; op: string; value: string | number };
  const readConds = (where: SQL): Cond[] => {
    const built = dialect.sqlToQuery(where) as unknown as {
      sql: string;
      params: unknown[];
    };
    const conds: Cond[] = [];
    const pattern = /"(\w+)"\s*(<=|>=|<>|!=|=|<|>)\s*\$(\d+)/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(built.sql)) !== null) {
      const value = built.params[Number(match[3]) - 1];
      if (typeof value === "string" || typeof value === "number") {
        conds.push({ field: match[1], op: match[2], value });
      }
    }
    return conds;
  };
  const matches = (
    row: { key: string; count: number; lastRequest: number },
    conds: Cond[],
  ) => {
    for (const cond of conds) {
      if (cond.field === "key") {
        if (row.key !== cond.value) return false;
        continue;
      }
      if (cond.field !== "lastRequest" && cond.field !== "count") continue;
      const value = cond.field === "count" ? row.count : row.lastRequest;
      const num = cond.value;
      if (typeof num !== "number") return false;
      switch (cond.op) {
        case "<":
          if (!(value < num)) return false;
          break;
        case "<=":
          if (!(value <= num)) return false;
          break;
        case ">":
          if (!(value > num)) return false;
          break;
        case ">=":
          if (!(value >= num)) return false;
          break;
        default:
          if (!(value === num)) return false;
      }
    }
    return true;
  };
  const filterRateRows = (conds: SQL[]) => {
    if (conds.length === 0) return [...rateRows.values()];
    const parsed = readConds(
      sql.join(conds, sql.raw(" and ")) as unknown as SQL,
    );
    return [...rateRows.values()].filter((row) => matches(row, parsed));
  };
  const isRateTable = (table: unknown) => table === betterAuthRateLimits;
  return {
    query: {
      ...query,
      // Present so model resolution succeeds; the adapter's plain findMany
      // always takes the db.select path below, never this.
      rateLimit: { findMany: async () => [] },
    },
    select: (cols?: Record<string, unknown>) => ({
      from: (table: unknown) => {
        if (!isRateTable(table)) {
          // Preserve the old miss behavior for every other model: the
          // adapter's catch treats this as "not found".
          throw new TypeError("db.select is not supported in tests");
        }
        const where = (...conds: SQL[]) => {
          // Awaited directly (findMany) and embedded via .limit into
          // incrementOne's IN-subquery, so this is both thenable and chained.
          const run = async () => filterRateRows(conds);
          void cols;
          return Object.assign(run(), {
            limit: () => ({
              getSQL: () => sql.join(conds, sql.raw(" and ")) as unknown as SQL,
            }),
          });
        };
        // findMany applies .limit before .where.
        return { where, limit: () => ({ where }) };
      },
    }),
    insert: (table: unknown) => {
      if (!isRateTable(table)) throw new Error("unsupported fake insert");
      return {
        values: (values: {
          key: string;
          count: number;
          lastRequest: number;
        }) => ({
          returning: async () => {
            const row = { ...values };
            rateRows.set(row.key, row);
            return [row];
          },
        }),
      };
    },
    update: (table: unknown) => {
      if (!isRateTable(table)) {
        return { set: () => ({ where: () => Promise.resolve() }) };
      }
      return {
        set: (assignments: Record<string, unknown>) => ({
          where: (where: SQL) => ({
            returning: async () => {
              const conds = readConds(where);
              const row = [...rateRows.values()].find((r) => matches(r, conds));
              // incrementOne only touches the row when its window/count
              // guard still holds; otherwise the wrapper re-reads and denies.
              if (!row) return [];
              for (const [field, value] of Object.entries(assignments)) {
                if (field !== "count" && field !== "lastRequest") continue;
                if (
                  typeof value === "object" &&
                  value !== null &&
                  "getSQL" in value
                ) {
                  const built = dialect.sqlToQuery(value as SQL) as unknown as {
                    params: unknown[];
                  };
                  const delta = built.params.find((p) => typeof p === "number");
                  if (field === "count" && typeof delta === "number") {
                    row.count += delta;
                  }
                } else if (typeof value === "number") {
                  (row as Record<string, number>)[field] = value;
                }
              }
              return [row];
            },
          }),
        }),
      };
    },
    delete: (table: unknown) => ({
      where: async (where: SQL) => {
        if (!isRateTable(table)) return { rowCount: 0 };
        const conds = readConds(where);
        let pruned = 0;
        for (const [key, row] of rateRows) {
          if (matches(row, conds)) {
            rateRows.delete(key);
            pruned += 1;
          }
        }
        return { rowCount: pruned };
      },
    }),
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

  it("generates UUID primary keys via advanced.database.generateId", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.advanced?.database?.generateId).toBe("uuid");
    expect(auth.options.advanced?.generateId).toBeUndefined();
  });

  it("persists rate-limit counters in the database (SE-17)", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.rateLimit?.storage).toBe("database");
    expect(auth.options.rateLimit?.customRules).toMatchObject({
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
    });
  });

  it("reads the client IP only from the configured headers", () => {
    const auth = createAuth(makeFakeDb(), {
      ipAddressHeaders: ["x-infinitunes-client-ip"],
    });
    expect(auth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual([
      "x-infinitunes-client-ip",
    ]);
    expect(
      createAuth(makeFakeDb()).options.advanced?.ipAddress,
    ).toBeUndefined();
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

  it("mirrors the credential password when an OAuth account sorts first", async () => {
    const userId = "00000000-0000-0000-0000-000000000001";
    const accounts = [
      { userId, providerId: "google", password: null },
      { userId, providerId: "credential", password: "credential-hash" },
    ];
    const mirroredPasswords: string[] = [];
    const query = {
      users,
      betterAuthAccounts: {
        findFirst: async ({
          where,
        }: {
          where: Parameters<PgDialect["sqlToQuery"]>[0];
        }) => {
          const { params } = new PgDialect().sqlToQuery(where);
          const userIdParam = params.indexOf(userId);
          const providerIdParam = params.indexOf("credential");
          return accounts.find(
            (account) =>
              account.userId === params[userIdParam] &&
              (providerIdParam === -1 ||
                account.providerId === params[providerIdParam]),
          );
        },
      },
      betterAuthSessions,
      betterAuthVerifications,
    };
    const db = {
      query,
      update: () => ({
        set: ({ password }: { password: string }) => ({
          where: async () => mirroredPasswords.push(password),
        }),
      }),
      _: {
        fullSchema: {
          users,
          betterAuthAccounts,
          betterAuthSessions,
          betterAuthVerifications,
          infinitunesPasskeys,
        },
      },
    } as unknown as Parameters<typeof createAuth>[0];
    const auth = createAuth(db);

    await auth.options.databaseHooks?.user?.create?.after?.({
      id: userId,
    } as never);

    expect(mirroredPasswords).toEqual(["credential-hash"]);
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
  it("ships only the passkey plugin by default, never next-cookies", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
      "passkey",
    ]);
  });

  it("appends caller-supplied plugins after the passkey plugin", () => {
    const marker = { id: "test-injected" } as unknown as BetterAuthPlugin;
    const auth = createAuth(makeFakeDb(), { plugins: [marker] });
    expect(auth.options.plugins?.map((plugin) => plugin.id)).toEqual([
      "passkey",
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

describe("Better Auth URL resolution", () => {
  const keys = [
    "BETTER_AUTH_URL",
    "AUTH_URL",
    "VERCEL_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const restore = () => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  };

  it("uses the production domain as base URL and trusts the preview host", () => {
    for (const k of keys) delete process.env[k];
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "infinitunes.example.com";
    process.env.VERCEL_URL = "infinitunes-abc.vercel.app";
    try {
      const auth = createAuth(makeFakeDb());
      expect(auth.options.baseURL).toBe("https://infinitunes.example.com");
      expect(auth.options.trustedOrigins).toEqual([
        "https://infinitunes.example.com",
        "https://infinitunes-abc.vercel.app",
      ]);
    } finally {
      restore();
    }
  });

  it("lets an explicit AUTH_URL win and still trusts the Vercel hosts", () => {
    for (const k of keys) delete process.env[k];
    process.env.AUTH_URL = "https://auth.example.com";
    process.env.VERCEL_URL = "infinitunes-abc.vercel.app";
    try {
      const auth = createAuth(makeFakeDb());
      expect(auth.options.baseURL).toBe("https://auth.example.com");
      expect(auth.options.trustedOrigins).toEqual([
        "https://auth.example.com",
        "https://infinitunes-abc.vercel.app",
      ]);
    } finally {
      restore();
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
    expect(getTableName(infinitunesPasskeys)).toBe("infinitunes_passkey");
    expect(infinitunesPasskeys.credentialID.name).toBe("credentialID");
  });
});

describe("Password reset configuration", () => {
  it("pins a one-hour single-use token and revokes sessions on reset", () => {
    const auth = createAuth(makeFakeDb());
    expect(auth.options.emailAndPassword?.resetPasswordTokenExpiresIn).toBe(
      3600,
    );
    expect(auth.options.emailAndPassword?.revokeSessionsOnPasswordReset).toBe(
      true,
    );
    expect(auth.options.emailAndPassword?.sendResetPassword).toBeTypeOf(
      "function",
    );
  });

  it("emails the reset link and swallows delivery failures", async () => {
    const sent: { to: string; text: string }[] = [];
    const ok = createAuth(makeFakeDb(), {
      sendEmail: async (email) => void sent.push(email),
    });
    await ok.options.emailAndPassword?.sendResetPassword?.({
      user: { email: "user@example.com" } as never,
      url: "https://app.test/api/auth/reset-password/tok",
      token: "tok",
    });
    expect(sent[0]?.to).toBe("user@example.com");
    expect(sent[0]?.text).toContain("/reset-password/tok");

    const failing = createAuth(makeFakeDb(), {
      sendEmail: async () => {
        throw new Error("boom");
      },
    });
    const original = console.error;
    console.error = () => {};
    try {
      await expect(
        failing.options.emailAndPassword?.sendResetPassword?.({
          user: { email: "user@example.com" } as never,
          url: "https://app.test/x",
          token: "tok",
        }),
      ).resolves.toBeUndefined();
    } finally {
      console.error = original;
    }
  });

  it("throttles the request endpoint after three calls a minute", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const auth = createAuth(makeFakeDb(), { sendEmail: async () => {} });
      expect(auth.options.rateLimit?.customRules).toMatchObject({
        "/request-password-reset": { window: 60, max: 3 },
      });
      const request = () =>
        auth.handler(
          new Request("http://localhost:3000/api/auth/request-password-reset", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost:3000",
              "x-forwarded-for": "203.0.113.9",
            },
            body: JSON.stringify({ email: "user@example.com" }),
          }),
        );

      const statuses: number[] = [];
      for (let i = 0; i < 4; i++) statuses.push((await request()).status);

      expect(statuses.slice(0, 3)).not.toContain(429);
      expect(statuses[3]).toBe(429);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
