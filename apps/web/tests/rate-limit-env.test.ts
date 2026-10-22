import { describe, expect, it } from "bun:test";

import { TRUSTED_PROXY_MODES } from "~/lib/client-ip";
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

  it("rejects an enabled limiter with a token but no URL", () => {
    expect(
      hasRateLimitCredentials({
        ENABLE_RATE_LIMITING: "true",
        UPSTASH_REDIS_REST_TOKEN: creds.UPSTASH_REDIS_REST_TOKEN,
      }),
    ).toBe(false);
  });

  it("accepts an enabled limiter with both credentials", () => {
    expect(
      hasRateLimitCredentials({ ENABLE_RATE_LIMITING: "true", ...creds }),
    ).toBe(true);
  });
});

// The helper alone would pass even if env.ts stopped calling it, so run the
// real module in a subprocess (validation is skipped in this test process).
describe("env.ts rate-limit wiring", () => {
  const base = {
    AUTH_URL: "http://localhost:3000",
    DATABASE_URL: "postgres://u:p@localhost:5432/d",
    JIOSAAVN_DES_KEY: "k",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
  };

  const prodAuth = {
    AUTH_SECRET: "secret-123456789012345678901234567890",
    GOOGLE_CLIENT_ID: "google-id",
    GOOGLE_CLIENT_SECRET: "google-secret",
    GITHUB_CLIENT_ID: "github-id",
    GITHUB_CLIENT_SECRET: "github-secret",
  };

  async function loadEnv(extra: Record<string, string>) {
    const proc = Bun.spawn(
      [process.execPath, "-e", 'await import("./lib/env.ts")'],
      {
        cwd: `${import.meta.dir}/..`,
        env: { PATH: process.env.PATH ?? "", ...base, ...extra },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const [out, err, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { output: out + err, code };
  }

  const message = "ENABLE_RATE_LIMITING=true requires";
  const warnMessage = "ENABLE_RATE_LIMITING is disabled in production";

  it("fails startup when enabled with only the token", async () => {
    const { output, code } = await loadEnv({
      ENABLE_RATE_LIMITING: "true",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
    expect(code).not.toBe(0);
    expect(output).toContain(message);
  });

  it("boots when disabled without credentials", async () => {
    const { output, code } = await loadEnv({ ENABLE_RATE_LIMITING: "false" });
    expect(output).not.toContain(message);
    expect(code).toBe(0);
  });

  it("boots when enabled with both credentials", async () => {
    const { output, code } = await loadEnv({
      ENABLE_RATE_LIMITING: "true",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
    });
    expect(output).not.toContain(message);
    expect(code).toBe(0);
  });

  it("warns on startup in production when ENABLE_RATE_LIMITING is disabled", async () => {
    const { output, code } = await loadEnv({
      NODE_ENV: "production",
      ENABLE_RATE_LIMITING: "false",
      ...prodAuth,
    });
    expect(code).toBe(0);
    expect(output).toContain(warnMessage);
  });

  it("does not warn in production when ENABLE_RATE_LIMITING is enabled", async () => {
    const { output, code } = await loadEnv({
      NODE_ENV: "production",
      ENABLE_RATE_LIMITING: "true",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      ...prodAuth,
    });
    expect(code).toBe(0);
    expect(output).not.toContain(warnMessage);
  });

  it("validates TRUSTED_PROXY against TRUSTED_PROXY_MODES", async () => {
    for (const mode of TRUSTED_PROXY_MODES) {
      const { code } = await loadEnv({ TRUSTED_PROXY: mode });
      expect(code).toBe(0);
    }
    const { output, code } = await loadEnv({ TRUSTED_PROXY: "invalid_proxy" });
    expect(code).not.toBe(0);
    expect(output).toContain("TRUSTED_PROXY");
  });
});
