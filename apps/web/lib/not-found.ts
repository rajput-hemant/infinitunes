import { notFound } from "next/navigation";

import { getErrorCode } from "~/lib/error-code";

/** True for a tRPC error whose code says the upstream entity does not exist. */
export function isNotFoundError(error: unknown): boolean {
  return getErrorCode(error) === "NOT_FOUND";
}

/**
 * Awaits a tRPC detail fetch and renders the segment's not-found UI when the
 * entity is missing. Any other failure (upstream down, timeout) is rethrown so
 * the error boundary handles it.
 */
export async function orNotFound<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }
}
