import { useSyncExternalStore } from "react";

/**
 * `~/lib/auth-client` for component tests (`jest.mock("~/lib/auth-client",
 * () => require("~/test/session-mock"))`): a session store that re-renders
 * its readers, like Better Auth's. Switch accounts with `signInAs`.
 */

type Session = { data: { user: { id: string } } | null };

let session: Session = { data: null };
const listeners = new Set<() => void>();

/** Signs in as `userId`, or out with `null`. */
export function signInAs(userId: string | null) {
  session = { data: userId ? { user: { id: userId } } : null };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const authClient = {
  useSession: () => useSyncExternalStore(subscribe, () => session),
  getCookie: () => (session.data ? "infinitunes.session_token=test" : ""),
};
