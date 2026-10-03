import { passkey } from "@better-auth/passkey";
import type { DbClient } from "@infinitunes/db/client";
import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  infinitunesPasskeys,
  users,
} from "@infinitunes/db/schema";
import { resolveAuthUrl } from "@infinitunes/env/schema";
import { createServerEnv } from "@infinitunes/env/server";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import type { BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { and, eq } from "drizzle-orm";

function safeHostname(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname || undefined;
  } catch {
    return undefined;
  }
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function createAuth(
  db: DbClient,
  options: { plugins?: BetterAuthPlugin[] } = {},
) {
  const env = createServerEnv({ skipValidation: true });
  // skipValidation returns raw env, so resolve the Vercel fallbacks here too.
  const vercelContext = {
    vercelUrl: process.env.VERCEL_URL,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  };
  const baseURL =
    process.env.BETTER_AUTH_URL || resolveAuthUrl(env.AUTH_URL, vercelContext);
  // The base URL is trusted implicitly; also trust this deployment's own host
  // (previews) and the production domain so CSRF/redirect checks pass there.
  const trustedOrigins = [
    ...new Set(
      [baseURL, vercelContext.vercelUrl, vercelContext.vercelProductionUrl]
        .map((url) => originOf(url && resolveAuthUrl(url, {})))
        .filter((origin): origin is string => origin !== undefined),
    ),
  ];
  const rpID =
    process.env.BETTER_AUTH_RP_ID || safeHostname(baseURL) || "localhost";

  async function mirrorAccountPassword(userId: string) {
    const account = await db.query.betterAuthAccounts.findFirst({
      where: and(
        eq(betterAuthAccounts.userId, userId),
        eq(betterAuthAccounts.providerId, "credential"),
      ),
    });

    if (account?.password) {
      await db
        .update(users)
        .set({ password: account.password })
        .where(eq(users.id, userId));
    }
  }

  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || env.AUTH_SECRET,
    baseURL,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: false,
      schema: {
        user: users,
        account: betterAuthAccounts,
        session: betterAuthSessions,
        verification: betterAuthVerifications,
        // Keyed by resolved model name: the adapter addresses plugin tables
        // via getModelName(), which returns "infinitunes_passkey".
        infinitunes_passkey: infinitunesPasskeys,
      },
    }),

    user: {
      fields: {
        name: "betterAuthName",
        emailVerified: "emailVerifiedBoolean",
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      password: {
        hash: async (password) => {
          return hash(password, 10);
        },
        verify: async ({ password, hash }) => {
          return compare(password, hash);
        },
      },
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: false,
      },
    },

    account: {
      accountLinking: {
        enabled: false,
        disableImplicitLinking: true,
      },
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (user.name !== undefined) {
              await db
                .update(users)
                .set({ name: user.name })
                .where(eq(users.id, user.id as string));
            }
            await mirrorAccountPassword(user.id as string);
          },
        },
        update: {
          after: async (user) => {
            if (user.name !== undefined) {
              await db
                .update(users)
                .set({ name: user.name })
                .where(eq(users.id, user.id as string));
            }
          },
        },
      },
      account: {
        create: {
          after: async (account) => {
            if (account.password) {
              await mirrorAccountPassword(account.userId as string);
            }
          },
        },
        update: {
          after: async (account) => {
            if (account.password) {
              await mirrorAccountPassword(account.userId as string);
            }
          },
        },
      },
    },

    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
      database: {
        generateId: "uuid",
      },
      crossSubDomainCookies: {
        enabled: false,
      },
    },

    plugins: [
      passkey({
        rpID,
        rpName: "Infinitunes",
        origin: baseURL,
        schema: {
          passkey: { modelName: "infinitunes_passkey" },
        },
      }),
      ...(options.plugins ?? []),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
