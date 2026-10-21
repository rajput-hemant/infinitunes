import { getErrorCode } from "@infinitunes/core/error-code";

const MAX_RETRIES = 3;

/** Codes that name a request or entity that will not change on a second try. */
const FINAL_CODES = new Set([
  "NOT_FOUND",
  "BAD_REQUEST",
  "FORBIDDEN",
  "UNAUTHORIZED",
]);

export function isNotFound(error: unknown): boolean {
  return getErrorCode(error) === "NOT_FOUND";
}

/**
 * The query client's default retries (three), minus the failures a retry
 * cannot fix: a missing entity stays missing, and retrying it would keep
 * the skeleton on screen for seconds before the not-found state.
 */
export function retryTransient(failureCount: number, error: unknown): boolean {
  const code = getErrorCode(error);
  return failureCount < MAX_RETRIES && !(code && FINAL_CODES.has(code));
}
