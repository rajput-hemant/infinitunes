/** Better Auth's default cookie prefix, kept in production. */
const DEFAULT_PREFIX = "better-auth";

/**
 * Infinitunes shares a database, and on localhost a cookie jar, with sibling
 * apps on other ports, so outside production its session cookie gets its own
 * prefix.
 */
const LOCAL_PREFIX = "infinitunes";

/**
 * The session cookie prefix for a server running under `nodeEnv`.
 * Production keeps Better Auth's default name so existing sessions survive.
 */
export function sessionCookiePrefix(
  nodeEnv = process.env.NODE_ENV,
): string | undefined {
  return nodeEnv === "production" ? undefined : LOCAL_PREFIX;
}

/**
 * Every prefix a server may use. Native clients cannot know the server's
 * `NODE_ENV`, so they recognise session cookies under either name.
 */
export const SESSION_COOKIE_PREFIXES = [DEFAULT_PREFIX, LOCAL_PREFIX] as const;
