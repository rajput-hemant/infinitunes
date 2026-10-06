import { passkey } from "@better-auth/passkey";
import type { DbClient } from "@infinitunes/db/client";
import {
  betterAuthAccounts,
  betterAuthRateLimits,
  betterAuthSessions,
  betterAuthVerifications,
  infinitunesPasskeys,
  users,
} from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import type { BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";

import { resetPasswordEmail } from "./emails";
import { authEnv, resolveAuthUrl } from "./env";
import { createSendEmail } from "./mail";
import type { SendEmail } from "./mail";
import { USER_NAME_MAX } from "./schemas";
import { originOf, parseUrl } from "./url";

/** Reset links are single use and expire after an hour (Better Auth default, pinned). */
export const RESET_TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Per-IP throttles on the reset endpoints (Better Auth's built-in limiter,
 * production only). Counters live in `infinitunes_rate_limit` (SE-17), so the
 * cap holds across serverless instances. The request endpoint is what sends
 * mail, so it is the tight one.
 */
export const RESET_RATE_LIMITS = {
  "/request-password-reset": { window: 60, max: 3 },
  "/reset-password": { window: 60, max: 5 },
} as const;

/** Better Auth's own endpoints skip the Zod schemas, so cap the name here too. */
function assertNameLength(user: { name?: unknown }) {
  if (
    typeof user.name === "string" &&
    user.name.trim().length > USER_NAME_MAX
  ) {
    throw new APIError("BAD_REQUEST", {
      message: `Name must be at most ${USER_NAME_MAX} characters long`,
    });
  }
}

export function createAuth(
  db: DbClient,
  options: {
    plugins?: BetterAuthPlugin[];
    /** Overrides the Resend/console mailer (tests). */
    sendEmail?: SendEmail;
    /**
     * Keeps work alive after the response (e.g. Next's `after`). Used so the
     * reset email is sent off the request path: response time then does not
     * reveal whether the address has an account.
     */
    runInBackground?: (promise: Promise<unknown>) => void;
    /**
     * Headers Better Auth reads the client IP from (its rate limiter keys on
     * it). Defaults to `x-forwarded-for`, which a client can forge unless a
     * trusted proxy rewrites it, so callers should name a header they control.
     */
    ipAddressHeaders?: string[];
  } = {},
) {
  const env = authEnv({ skipValidation: true });
  // skipValidation returns raw env, so resolve the Vercel fallbacks here too.
  const vercelContext = {
    vercelUrl: process.env.VERCEL_URL,
    vercelProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  };
  const baseURL =
    env.BETTER_AUTH_URL || resolveAuthUrl(env.AUTH_URL, vercelContext);
  // The base URL is trusted implicitly; also trust this deployment's own host
  // (previews) and the production domain so CSRF/redirect checks pass there.
  const trustedOrigins = [
    ...new Set(
      [baseURL, vercelContext.vercelUrl, vercelContext.vercelProductionUrl]
        .map((url) => originOf(url && resolveAuthUrl(url, {})))
        .filter((origin): origin is string => origin !== null),
    ),
  ];
  const rpID =
    env.BETTER_AUTH_RP_ID || parseUrl(baseURL)?.hostname || "localhost";

  const sendEmail =
    options.sendEmail ??
    createSendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      nodeEnv: env.NODE_ENV,
    });

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
    secret: env.BETTER_AUTH_SECRET || env.AUTH_SECRET,
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
        rateLimit: betterAuthRateLimits,
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
      resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
      // A reset proves control of the inbox: sign out every device.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        // Never throw: a delivery failure must not turn the generic response
        // into an account-existence signal. The link is not logged here.
        try {
          await sendEmail({
            to: user.email,
            ...resetPasswordEmail({
              url,
              expiresInMinutes: RESET_TOKEN_TTL_SECONDS / 60,
            }),
          });
        } catch (error) {
          console.error(
            "[auth] password reset email failed:",
            error instanceof Error ? error.message : "unknown error",
          );
        }
      },
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
          before: async (user) => {
            assertNameLength(user);
          },
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
          before: async (user) => {
            assertNameLength(user);
          },
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

    rateLimit: {
      enabled: env.NODE_ENV === "production",
      storage: "database",
      customRules: { ...RESET_RATE_LIMITS },
    },

    advanced: {
      ...(options.ipAddressHeaders
        ? { ipAddress: { ipAddressHeaders: options.ipAddressHeaders } }
        : {}),
      ...(options.runInBackground
        ? { backgroundTasks: { handler: options.runInBackground } }
        : {}),
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
      database: {
        generateId: "uuid",
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
