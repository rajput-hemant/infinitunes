import { authClient } from "~/lib/auth-client";
import { authFailure } from "~/lib/auth-failure";
import type { AuthFailure } from "~/lib/auth-failure";
import { queryClient } from "~/lib/query-client";
import { trpc } from "~/lib/trpc";
import { playerStore } from "~/playback/player-store";
import { LIBRARY_QUERY_KEY } from "~/user-data/session";

/**
 * Stops playback and drops every cached `user.*` query (likes, playlists) and the library lists
 * resolved from them (history, liked songs, playlist songs). They are keyed
 * per account already; this also frees them, and keeps the catalog cache.
 */
export function forgetUserData() {
  // Emptying the queue and clearing `started` makes the playback controller
  // stop the engine and take the track off the lock screen and the media
  // notification; `started` false also keeps the next "Add to queue" from
  // auto-playing.
  playerStore.setState({
    queue: [],
    currentIndex: 0,
    radio: null,
    started: false,
  });
  queryClient.removeQueries({ queryKey: trpc.user.pathKey() });
  queryClient.removeQueries({ queryKey: LIBRARY_QUERY_KEY });
}

/** Signs out on the server and from secure storage, then forgets the account's data. */
export async function signOut(): Promise<AuthFailure | undefined> {
  const failure = await authFailure(() => authClient.signOut());
  if (!failure) forgetUserData();
  return failure;
}

/**
 * Ends this device's session for an account the server just deleted (its
 * server session went with it). The account's cached data is dropped whatever
 * happens. Resolves `false` when a failed sign-out left the stored cookie
 * behind: the session is then re-read, and the server answers a deleted
 * session with no user and an expired cookie, which signs the device out.
 */
export async function forgetDeletedAccount(): Promise<boolean> {
  forgetUserData();
  if (!(await signOut())) return true;
  // Better Auth's expo client clears the stored cookie before it sends
  // /sign-out, so a failed request has usually signed out locally anyway.
  if (!(await authClient.getCookie())) return true;
  refreshSession();
  return false;
}

/** Makes the session store re-read the account after a change made outside Better Auth. */
export function refreshSession() {
  authClient.$store.notify("$sessionSignal");
}
