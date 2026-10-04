/**
 * tRPC codes do not survive the server-action boundary: Next.js delivers a
 * plain `Error` carrying only the message, so `userMessage` could not tell a
 * user-caused failure from an upstream outage. Action wrappers rethrow via
 * {@link toActionError}, which embeds the code in a machine-readable prefix
 * that {@link getErrorCode} parses back out.
 */
const ACTION_CODE_PREFIX = /^\[([A-Z][A-Z0-9_]*)\] /;

export function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if (
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    typeof error.data.code === "string"
  ) {
    return error.data.code;
  }
  if (error instanceof Error) {
    return ACTION_CODE_PREFIX.exec(error.message)?.[1];
  }
  return undefined;
}

/** Drops the `[CODE] ` prefix {@link toActionError} adds, for display copy. */
export function stripActionCode(message: string): string {
  return message.replace(ACTION_CODE_PREFIX, "");
}

/**
 * Rewraps a caught error as a plain `Error` that keeps the tRPC code across
 * the server-action boundary. Code-less errors keep their message unchanged.
 */
export function toActionError(error: unknown): Error {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : "Unknown error";
  return new Error(code ? `[${code}] ${message}` : message);
}

/** Runs an action body, rethrowing failures as {@link toActionError}. */
export async function withActionCode<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw toActionError(error);
  }
}
