import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import type { AuthFailure } from "~/lib/auth-failure";
import { queryClient } from "~/lib/query-client";
import { trpc } from "~/lib/trpc";

/**
 * Drops every cached `user.*` query (library, playlists). They are keyed per
 * account already; this also frees them, and keeps the catalog cache.
 */
export function forgetUserData() {
  queryClient.removeQueries({ queryKey: trpc.user.pathKey() });
}

/** Signs out on the server and from secure storage, then forgets the account's data. */
export async function signOut(): Promise<AuthFailure | undefined> {
  const failure = await authFailure(() => authClient.signOut());
  if (!failure) forgetUserData();
  return failure;
}

/** Makes the session store re-read the account after a change made outside Better Auth. */
export function refreshSession() {
  authClient.$store.notify("$sessionSignal");
}
