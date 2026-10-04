import { redirect } from "next/navigation";

import { getUser } from "~/lib/auth";

/**
 * Sends a signed-in user home from a page meant for signed-out visitors.
 * Called per page rather than in the `(auth)` layout, which cannot see the
 * reset link's `token` search param.
 */
export async function redirectIfSignedIn(): Promise<void> {
  if (await getUser()) redirect("/");
}
