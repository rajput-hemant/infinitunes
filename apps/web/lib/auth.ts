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
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export const getUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
