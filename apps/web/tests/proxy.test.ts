import { beforeAll, describe, expect, it, mock } from "bun:test";

import * as betterAuthCookies from "better-auth/cookies";
import type { NextRequest } from "next/server";

const fromEnv = mock(() => {
  throw new Error("Redis.fromEnv must not run when rate limiting is off");
});

const getSessionCookie = mock(() => undefined as string | undefined);

mock.module("@upstash/redis", () => ({
  Redis: { fromEnv },
}));

mock.module("better-auth/cookies", () => ({
  ...betterAuthCookies,
  getSessionCookie,
}));

mock.module("next/server", () => ({
  NextResponse: {
    next: () => ({ status: 200 }),
    json: (_body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
    }),
    redirect: (url: URL) => ({ status: 307, headers: { location: url.href } }),
  },
}));

process.env.SKIP_ENV_VALIDATION = "true";
process.env.ENABLE_RATE_LIMITING = "false";
process.env.NODE_ENV = "production";

function createNextRequest(
  href: string,
  method: "GET" | "OPTIONS" = "GET",
): NextRequest {
  const nextUrl = new URL(href);

  return {
    nextUrl,
    method,
    headers: new Headers(),
    ip: undefined,
  } as NextRequest;
}

describe("proxy Upstash client laziness", () => {
  let proxy: typeof import("../proxy").proxy;

  beforeAll(async () => {
    ({ proxy } = await import("../proxy"));
  });

  it("does not construct Redis.fromEnv when rate limiting is disabled", async () => {
    const res = await proxy(createNextRequest("http://localhost:3000/"));

    expect(res.status).toBe(200);
    expect(fromEnv).not.toHaveBeenCalled();
  });
});

describe("proxy guest route access", () => {
  let proxy: typeof import("../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../proxy"));
  });

  it("allows guest /settings without redirecting to login", async () => {
    const res = await proxy(
      createNextRequest("http://localhost:3000/settings"),
    );

    expect(res.status).toBe(200);
  });

  it("redirects guest /me to login", async () => {
    const res = await proxy(
      createNextRequest("http://localhost:3000/me/albums"),
    );

    expect(res.status).toBe(307);
    expect((res as { headers: { location: string } }).headers.location).toBe(
      "http://localhost:3000/login",
    );
  });
});
