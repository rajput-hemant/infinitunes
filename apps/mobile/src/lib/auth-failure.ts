import { userMessage } from "@infinitunes/core/user-message";

/** The part of a Better Auth error the app reads. */
type AuthError = { status: number; message?: string; code?: string };

export type AuthFailure = {
  /** Copy that is safe to show the listener. */
  message: string;
  /** Better Auth's error code, e.g. `INVALID_TOKEN`; absent for a thrown error. */
  code?: string;
};

const RATE_LIMITED_MESSAGE =
  "Too many attempts. Please wait a minute and try again.";

function failureOf({ status, message, code }: AuthError): AuthFailure {
  if (status === 429) return { message: RATE_LIMITED_MESSAGE, code };
  // Server faults carry no copy written for the listener.
  return { message: userMessage(status < 500 ? message : null), code };
}

/**
 * Runs an auth request and resolves to what went wrong, or `undefined` on
 * success. A thrown error (offline) is reported too.
 */
export async function authFailure(
  request: () => Promise<{ error: AuthError | null }>,
): Promise<AuthFailure | undefined> {
  try {
    const { error } = await request();
    return error ? failureOf(error) : undefined;
  } catch (error) {
    console.error(error);
    return { message: userMessage(error) };
  }
}
