import type { DbClient } from "@infinitunes/db/client";
import {
  betterAuthAccounts,
  betterAuthSessions,
  betterAuthVerifications,
  users,
} from "@infinitunes/db/schema";
import { createServerEnv } from "@infinitunes/env/server";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from "./constants";

export function createAuth(db: DbClient) {
  const env = createServerEnv({ skipValidation: true });

  // Map existing AUTH_SECRET / AUTH_URL env vars to Better Auth defaults
  if (!process.env.BETTER_AUTH_SECRET && env.AUTH_SECRET) {
    process.env.BETTER_AUTH_SECRET = env.AUTH_SECRET;
  }
  if (!process.env.BETTER_AUTH_URL && env.AUTH_URL) {
    process.env.BETTER_AUTH_URL = env.AUTH_URL;
  }

  async function mirrorAccountPassword(userId: string) {
    const account = await db.query.betterAuthAccounts.findFirst({
      where: eq(betterAuthAccounts.userId, userId),
    });

    if (account?.password) {
      await db
        .update(users)
        .set({ password: account.password })
        .where(eq(users.id, userId));
    }
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: false,
      schema: {
        user: users,
        account: betterAuthAccounts,
        session: betterAuthSessions,
        verification: betterAuthVerifications,
      },
    }),

    user: {
      fields: {
        name: "betterAuthName",
        emailVerified: "emailVerifiedBoolean",
      },
      additionalFields: {
        username: {
          type: "string",
          required: false,
          unique: true,
        },
        displayUsername: {
          type: "string",
          required: false,
        },
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
            const patch: Record<string, unknown> = {};
            if (user.name !== undefined) patch.name = user.name;
            if (user.username !== undefined) patch.username = user.username;
            if (Object.keys(patch).length > 0) {
              await db
                .update(users)
                .set(patch)
                .where(eq(users.id, user.id as string));
            }
            await mirrorAccountPassword(user.id as string);
          },
        },
        update: {
          after: async (user) => {
            const patch: Record<string, unknown> = {};
            if (user.name !== undefined) patch.name = user.name;
            if (user.username !== undefined) patch.username = user.username;
            if (Object.keys(patch).length > 0) {
              await db
                .update(users)
                .set(patch)
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
      generateId: () => crypto.randomUUID(),
      crossSubDomainCookies: {
        enabled: false,
      },
    },

    plugins: [
      username({
        minUsernameLength: USERNAME_MIN_LENGTH,
        maxUsernameLength: USERNAME_MAX_LENGTH,
        usernameValidator: (username) => USERNAME_REGEX.test(username),
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
