import { createAuth } from "@infinitunes/auth";
import { db } from "@infinitunes/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!authInstance) {
    authInstance = createAuth(db);
  }
  return authInstance;
}

// Proxy so that importing `auth` or `getUser` never initializes Better Auth
// (or touches the `db` proxy) at module evaluation time during Next.js build.
export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, prop) {
    const instance = getAuth() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has: (_target, prop) => prop in (getAuth() as object),
});

export type { User } from "@infinitunes/auth";

/**
 * Better Auth refuses to run without a real secret and throws from
 * `validateSecret` on the first API call - either
 * `You are using the default secret ...` (its placeholder is still in place) or
 * `BETTER_AUTH_SECRET is missing ...`. Match only those; everything else must
 * still propagate.
 */
function isMissingSecretError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "BetterAuthError" &&
    (error.message.includes("You are using the default secret") ||
      error.message.includes("BETTER_AUTH_SECRET is missing"))
  );
}

/**
 * A production deployment whose env passed validation always has a real
 * `AUTH_SECRET` (`authSecret()` in `packages/env/src/schema.ts`), so a missing
 * secret there is a genuine misconfiguration and must surface. The error is
 * only reachable in production when validation was deliberately skipped.
 */
function isValidatedProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.SKIP_ENV_VALIDATION !== "true"
  );
}

/**
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export const getUser = cache(async () => {
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;

  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    if (!isMissingSecretError(error) || isValidatedProduction()) throw error;

    // No secret configured outside a validated production deployment (fresh
    // checkout, preview build): nobody can be signed in, so render the page
    // logged-out instead of 500-ing every route in the app.
    return undefined;
  }

  if (!session?.user) return undefined;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    username: session.user.username,
  };
});

/**
 * Checks if the current user is authenticated
 * If not, redirects to the login page
 */
export const checkAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");
};
