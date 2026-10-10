const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Throws unless `databaseUrl` parses to a loopback host and NODE_ENV is not
 * production. Checks the parsed hostname only, and rejects `host`/`hostaddr`
 * query parameters, which the Postgres client would use to override it.
 */
export function assertLocalDatabase(
  databaseUrl: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): void {
  if (nodeEnv === "production") {
    throw new Error("[local-dev] Refusing to run: NODE_ENV is production.");
  }
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("[local-dev] Refusing to run: DATABASE_URL is not a URL.");
  }
  if (url.searchParams.has("host") || url.searchParams.has("hostaddr")) {
    throw new Error(
      "[local-dev] Refusing to run: DATABASE_URL must not set host in its query string.",
    );
  }
  if (!LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(
      `[local-dev] Refusing to run: database host "${url.hostname}" is not loopback (localhost, 127.0.0.1, ::1).`,
    );
  }
}

/** Non-throwing form of `assertLocalDatabase` for callers that only gate. */
export function isLocalDatabase(
  databaseUrl: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  try {
    assertLocalDatabase(databaseUrl, nodeEnv);
    return true;
  } catch {
    return false;
  }
}
