import { useSyncExternalStore } from "react";

/**
 * `~/lib/auth-client` in every suite (`src/test/setup.ts` maps it here): a
 * session store that re-renders its readers, like Better Auth's, plus every
 * Better Auth call the screens make, each answering success until a test
 * queues a failure with `mockResolvedValueOnce`. Switch accounts with
 * `signInAs`; every test starts signed out.
 */

type SessionUser = { id: string; name: string; email: string };
type Session = { data: { user: SessionUser } | null; isPending: false };

let session: Session = { data: null, isPending: false };
const listeners = new Set<() => void>();

/** Signs in as `userId` (a listener with a default name and email), or out with `null`. */
export function signInAs(
  userId: string | null,
  profile: Partial<Omit<SessionUser, "id">> = {},
) {
  session = {
    data: userId
      ? {
          user: {
            id: userId,
            name: "Listener",
            email: "listener@example.com",
            ...profile,
          },
        }
      : null,
    isPending: false,
  };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export type AuthResult = {
  error: { status: number; message?: string; code?: string } | null;
};

const succeed = async (..._args: unknown[]): Promise<AuthResult> => ({
  error: null,
});

export const authClient = {
  useSession: () => useSyncExternalStore(subscribe, () => session),
  // Async like Better Auth's expo client: the cookie is read from secure storage.
  getCookie: async () => (session.data ? "infinitunes.session_token=test" : ""),
  signIn: { email: jest.fn(succeed) },
  signUp: { email: jest.fn(succeed) },
  signOut: jest.fn(succeed),
  requestPasswordReset: jest.fn(succeed),
  resetPassword: jest.fn(succeed),
  $store: { notify: jest.fn() },
};
