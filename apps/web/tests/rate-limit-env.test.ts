import { describe, expect, it } from "bun:test";

import { hasRateLimitCredentials } from "~/lib/rate-limit-env";

const creds = {
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

describe("hasRateLimitCredentials", () => {
  it("accepts a disabled limiter without credentials", () => {
    expect(hasRateLimitCredentials({ ENABLE_RATE_LIMITING: "false" })).toBe(
      true,
    );
  });

  it("rejects an enabled limiter without credentials", () => {
    expect(hasRateLimitCredentials({ ENABLE_RATE_LIMITING: "true" })).toBe(
      false,
    );
    expect(
      hasRateLimitCredentials({
        ENABLE_RATE_LIMITING: "true",
        UPSTASH_REDIS_REST_URL: creds.UPSTASH_REDIS_REST_URL,
      }),
    ).toBe(false);
  });

  it("accepts an enabled limiter with both credentials", () => {
    expect(
      hasRateLimitCredentials({ ENABLE_RATE_LIMITING: "true", ...creds }),
    ).toBe(true);
  });
});
