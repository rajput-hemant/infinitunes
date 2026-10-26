import { expo } from "@better-auth/expo";
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
import { USER_NAME_MAX } from "@infinitunes/types";
import { compare, hash } from "bcryptjs";
import { betterAuth } from "better-auth";
import type { BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
} from "better-auth/api";
import { and, desc, eq, ne } from "drizzle-orm";

import { changeEmailVerificationEmail, resetPasswordEmail } from "./emails";
import { authEnv, resolveAuthUrl } from "./env";
import { createSendEmail } from "./mail";
import type { SendEmail } from "./mail";
import {
  androidApkKeyHashOrigin,
  NATIVE_APP_ID,
  NATIVE_APP_ORIGIN,
  parseFingerprints,
} from "./native-app";
import { passwordLengthSchema } from "./schemas";
import { originOf, parseUrl } from "./url";
import { webRedirectsOnly } from "./web-redirects";

/** Reset links are single use and expire after an hour (Better Auth default, pinned). */
export const RESET_TOKEN_TTL_SECONDS = 60 * 60;

/** Email-change confirmation links expire after an hour. */
export const EMAIL_CHANGE_TTL_SECONDS = 60 * 60;

/**
 * Per-IP throttles on the reset endpoints (Better Auth's built-in limiter,
 * production only). Counters live in `infinitunes_rate_limit` (SE-17), so the
 * cap holds across serverless instances. The request endpoint is what sends
 * mail, so it is the tight one.
 */
export const RESET_RATE_LIMITS = {
  "/request-password-reset": { window: 60, max: 3 },
  "/reset-password": { window: 60, max: 5 },
  // Configuring `sendVerificationEmail` also exposes this public mailer.
  "/send-verification-email": { window: 60, max: 3 },
} as const;

type OAuthCredentials = { clientId: string; clientSecret: string };

/** The credentials, or undefined when either half is not set. */
function oauthCredentials(
  clientId: string | undefined,
  clientSecret: string | undefined,
): OAuthCredentials | undefined {
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

/**
 * Better Auth's own endpoints skip the Zod schemas, so cap the name here too.
 * Returns the trimmed name, or undefined when there is nothing to store.
 * `truncate` is for OAuth profiles (not user-typed): an over-long provider
 * name must not block sign-in. User-typed updates are rejected instead.
 */
function normalizeName(
  user: { name?: unknown },
  mode: "truncate" | "reject",
): { data: { name: string } } | undefined {
  if (typeof user.name !== "string") return undefined;
  const name = user.name.trim();
  if (name.length > USER_NAME_MAX && mode === "reject") {
    throw new APIError("BAD_REQUEST", {
      message: `Name must be at most ${USER_NAME_MAX} characters long`,
    });
  }
  return { data: { name: name.slice(0, USER_NAME_MAX) } };
}

function assertNewPasswordLength(password: unknown) {
  const result = passwordLengthSchema.safeParse(password);
  if (!result.success) {
    throw new APIError("BAD_REQUEST", {
      message: result.error.issues[0]!.message,
    });
  }
}

/**
 * Signs out every other device once an email change is confirmed (the change
 * used to do this when it was written). `keepToken` is the session that stays:
 * the confirming browser's own, else the newest one (Better Auth just minted it
 * for a browser that had none). Failures are logged, never thrown: the email
 * has already changed by the time this runs.
 */
export async function revokeOtherSessions(
  db: DbClient,
  userId: string,
  keepToken: string | undefined,
) {
  try {
    let keep = keepToken;
    if (!keep) {
      const [newest] = await db
        .select({ token: betterAuthSessions.token })
        .from(betterAuthSessions)
        .where(eq(betterAuthSessions.userId, userId))
        .orderBy(desc(betterAuthSessions.createdAt))
        .limit(1);
      keep = newest?.token;
    }
    await db
      .delete(betterAuthSessions)
      .where(
        keep
          ? and(
              eq(betterAuthSessions.userId, userId),
              ne(betterAuthSessions.token, keep),
            )
          : eq(betterAuthSessions.userId, userId),
      );
  } catch (error) {
    console.error(
      "[auth] revoking sessions after an email change failed:",
      error instanceof Error ? error.message : "unknown error",
    );
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
    /**
     * Prefix of Better Auth's cookies (`<prefix>.session_token`). Cookies are
     * not port-isolated on localhost, so apps sharing one never overwrite each
     * other's session with a distinct prefix. Default: `better-auth`.
     */
    cookiePrefix?: string;
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
  // (previews) and the production domain so CSRF/redirect checks pass there,
  // and the native app, whose requests the `expo` plugin gives its origin
  // (`webRedirectsOnly` keeps its scheme from being a redirect target).
  const trustedOrigins = [
    ...new Set(
      [baseURL, vercelContext.vercelUrl, vercelContext.vercelProductionUrl]
        .map((url) => originOf(url && resolveAuthUrl(url, {})))
        .filter((origin): origin is string => origin !== null),
    ),
    NATIVE_APP_ORIGIN,
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

  const google = oauthCredentials(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );
  const github = oauthCredentials(
    env.GITHUB_CLIENT_ID,
    env.GITHUB_CLIENT_SECRET,
  );
  // The iOS app's ID tokens name the bundle id as their audience; verifying
  // one needs no secret (only a web redirect flow would).
  const apple = env.APPLE_CLIENT_ID
    ? {
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET ?? "",
        appBundleIdentifier: NATIVE_APP_ID,
      }
    : undefined;
  // Only configured providers: Better Auth warns on every request about one
  // without credentials. Production always has Google and GitHub (`./env`).
  const socialProviders = {
    ...(google && { google }),
    ...(github && { github }),
    ...(apple && { apple }),
  };
  // The Android app signs passkey assertions with its own origin.
  const passkeyOrigins = [
    baseURL,
    ...parseFingerprints(env.ANDROID_CERT_SHA256_FINGERPRINTS).map(
      androidApkKeyHashOrigin,
    ),
  ].filter((origin): origin is string => Boolean(origin));

  // Set once Better Auth exists: the confirm hook reads the opener's session.
  let sessionTokenOf = async (_headers: Headers): Promise<string | undefined> =>
    undefined;

  const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET || env.AUTH_SECRET,
    baseURL,
    trustedOrigins,
    // The `expo` plugin's browser OAuth relay: an unauthenticated GET that
    // plants a caller-chosen OAuth state cookie, then redirects to any https
    // URL. The native app signs in with ID tokens, which never use it.
    disabledPaths: ["/expo-authorization-proxy"],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          assertNewPasswordLength(ctx.body?.password);
        } else if (
          ["/reset-password", "/change-password", "/set-password"].includes(
            ctx.path,
          )
        ) {
          // Reject before a reset consumes its single-use token.
          assertNewPasswordLength(ctx.body?.newPassword);
        }
      }),
    },
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
      // The address changes only when the link mailed to the NEW address is
      // opened (X-1). `updateEmailWithoutVerification` stays off, so even an
      // unverified account cannot switch to an address it does not control.
      changeEmail: { enabled: true },
    },

    emailVerification: {
      expiresIn: EMAIL_CHANGE_TTL_SECONDS,
      // Runs after a confirmed email change, and also after a plain address
      // verification (the public /send-verification-email flow), which then
      // signs the user out of their other devices too.
      afterEmailVerification: async (user, request) => {
        const keep = request
          ? await sessionTokenOf(request.headers).catch(() => undefined)
          : undefined;
        await revokeOtherSessions(db, user.id, keep);
      },
      // The only verification mail we send is the change-email link, and it
      // goes to the new address (`user.email` is already the new one here).
      sendVerificationEmail: async ({ user, url }) => {
        // Never throw: Better Auth answers identically for an address that
        // already has an account, so a delivery failure must not tell them apart.
        try {
          await sendEmail({
            to: user.email,
            ...changeEmailVerificationEmail({
              url,
              newEmail: user.email,
              expiresInMinutes: EMAIL_CHANGE_TTL_SECONDS / 60,
            }),
          });
        } catch (error) {
          console.error(
            "[auth] email change verification failed:",
            error instanceof Error ? error.message : "unknown error",
          );
        }
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
        verify: async ({ password, hash: storedHash }) => {
          return compare(password, storedHash);
        },
      },
    },

    socialProviders,

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
          before: async (user) => normalizeName(user, "truncate"),
        },
        update: {
          before: async (user) => normalizeName(user, "reject"),
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
      ...(options.cookiePrefix ? { cookiePrefix: options.cookiePrefix } : {}),
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
        // Never `[]`: it would skip the plugin's request-origin fallback.
        origin: passkeyOrigins.length ? passkeyOrigins : null,
        schema: {
          passkey: { modelName: "infinitunes_passkey" },
        },
      }),
      expo(),
      webRedirectsOnly(),
      {
        id: "infinitunes-social-providers",
        endpoints: {
          // The providers this server signs in with; the app hides the rest.
          socialProviders: createAuthEndpoint(
            "/social-providers",
            { method: "GET" },
            async (ctx) => ctx.json(Object.keys(socialProviders)),
          ),
        },
      },
      ...(options.plugins ?? []),
    ],
  });

  sessionTokenOf = async (headers) =>
    (await auth.api.getSession({ headers }))?.session.token;

  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
