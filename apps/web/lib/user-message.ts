import { getErrorCode } from "~/lib/error-code";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

/** tRPC codes whose server message is written for the user and safe to show. */
const USER_CODES = new Set([
  "BAD_REQUEST",
  "CONFLICT",
  "FORBIDDEN",
  "NOT_FOUND",
  "UNAUTHORIZED",
]);

/** Next.js replaces server-action error messages with this in production. */
const OMITTED_MESSAGE = "omitted in production builds";

/**
 * Maps a thrown error (a `TRPCError`, a `TRPCClientError`, or the plain `Error`
 * a server action surfaces) to copy that is safe to put in a toast. Messages
 * for user-caused codes are kept; upstream failures (`BAD_GATEWAY`,
 * `TIMEOUT`, `INTERNAL_SERVER_ERROR`, ...) become generic copy. Server actions
 * drop the code, so an error without one keeps its message unless Next.js
 * already masked it. Log the original error separately.
 */
export function userMessage(
  error: unknown,
  fallback: string = GENERIC_MESSAGE,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (!message || message.includes(OMITTED_MESSAGE)) return fallback;

  const code = getErrorCode(error);
  if (code === undefined || USER_CODES.has(code)) return message;
  return fallback;
}
