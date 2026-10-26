import { bareResponseStatus, getErrorCode } from "./error-code";

export const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export const RATE_LIMITED_MESSAGE =
  "Too many requests. Please wait a moment and try again.";

/** tRPC codes whose server message is written for the user and safe to show. */
const USER_CODES = new Set([
  "BAD_REQUEST",
  "CONFLICT",
  "FORBIDDEN",
  "NOT_FOUND",
]);

/**
 * The copy for an input validation failure: the first issue's message. `cause`
 * is a tRPC error's cause; anything without zod's `issues` list is `undefined`.
 * The HTTP `errorFormatter` and `userMessage` (server actions call procedures
 * directly, with no formatter) share it, so no client sees zod's JSON.
 */
export function validationMessage(cause: unknown): string | undefined {
  if (
    typeof cause !== "object" ||
    cause === null ||
    !("issues" in cause) ||
    !Array.isArray(cause.issues)
  )
    return undefined;
  const first: unknown = cause.issues[0];
  const message =
    typeof first === "object" && first !== null && "message" in first
      ? first.message
      : undefined;
  return typeof message === "string" && message ? message : "Invalid request";
}

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
  const invalid = validationMessage(
    error instanceof Error ? error.cause : undefined,
  );
  if (invalid) return invalid;

  const code = getErrorCode(error);
  if (code === "UNAUTHORIZED") return "Please sign in to continue.";
  if (code === "TOO_MANY_REQUESTS") return RATE_LIMITED_MESSAGE;
  // Not a tRPC error body (the proxy's 403, a gateway page): tRPC's own
  // "Unable to transform response from server" is not copy for the user.
  if (bareResponseStatus(error) !== undefined) return fallback;
  if (code === undefined || USER_CODES.has(code)) return message;
  return fallback;
}
