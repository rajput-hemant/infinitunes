import { unstable_rethrow } from "next/navigation";

import { isNotFoundError } from "~/lib/not-found";

/**
 * Optional data (shell links, recommendations, a signed-in user's library) must
 * not take a public page down: log the failure and render without it. Primary
 * entities stay on `orNotFound` so a missing one is a 404 and an outage reaches
 * the error boundary.
 *
 * Next's redirect()/notFound() control flow is rethrown, and a NOT_FOUND-coded
 * error ("this item has no lyrics") is an expected absence, so it falls back
 * without logging.
 */
export async function orFallback<T, F>(
  label: string,
  request: Promise<T>,
  fallback: F,
  scope = "degrade",
): Promise<T | F> {
  try {
    return await request;
  } catch (error) {
    unstable_rethrow(error);
    if (isNotFoundError(error)) return fallback;
    console.error(
      `[${scope}] ${label} unavailable, rendering without it`,
      error,
    );
    return fallback;
  }
}
