import { createAuth } from "@infinitunes/auth";
import { db } from "@infinitunes/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const auth = createAuth(db);

export { auth };

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
