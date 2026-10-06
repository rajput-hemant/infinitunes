/**
 * Optional data (shell links, recommendations, a signed-in user's library) must
 * not take a public page down: log the failure and render without it. Primary
 * entities stay on `orNotFound` so a missing one is a 404 and an outage reaches
 * the error boundary.
 */
export async function orFallback<T, F>(
  label: string,
  request: Promise<T>,
  fallback: F,
): Promise<T | F> {
  try {
    return await request;
  } catch (error) {
    console.error(
      `[degrade] ${label} unavailable, rendering without it`,
      error,
    );
    return fallback;
  }
}
