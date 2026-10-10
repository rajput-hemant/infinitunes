/**
 * Infinitunes shares a database, and on localhost a cookie jar, with sibling
 * apps on other ports. A distinct prefix keeps its session cookie from being
 * overwritten by theirs. Production keeps Better Auth's default name so
 * existing sessions survive.
 */
export function sessionCookiePrefix(
  nodeEnv = process.env.NODE_ENV,
): string | undefined {
  return nodeEnv === "production" ? undefined : "infinitunes";
}
