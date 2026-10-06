/**
 * Rate limiting needs Upstash credentials: `Redis.fromEnv()` throws without
 * them, which would turn every request into a 500. Fail env validation at
 * startup instead.
 */
export function hasRateLimitCredentials(env: {
  ENABLE_RATE_LIMITING: "true" | "false";
  UPSTASH_REDIS_REST_URL?: string | undefined;
  UPSTASH_REDIS_REST_TOKEN?: string | undefined;
}): boolean {
  if (env.ENABLE_RATE_LIMITING !== "true") return true;
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}
