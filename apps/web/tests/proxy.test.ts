import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";

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
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = "production";

// bun runs every test file in one process; do not leak NODE_ENV=production
// into unrelated suites (it broke `assertLocalDatabase` under `bun run test`).
afterAll(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

function createNextRequest(
  href: string,
  method: "GET" | "POST" | "OPTIONS" = "GET",
  headers: Record<string, string> = {},
): NextRequest {
  const nextUrl = new URL(href);

  return {
    nextUrl,
    method,
    headers: new Headers(headers),
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

describe("proxy detail route normalization", () => {
  let proxy: typeof import("../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../proxy"));
  });

  it("redirects two-segment /playlist/<x> like other entity routes", async () => {
    const res = await proxy(
      createNextRequest("http://localhost:3000/playlist/foo"),
    );

    expect(res.status).toBe(307);
    expect((res as { headers: { location: string } }).headers.location).toBe(
      "http://localhost:3000/playlist",
    );
  });

  it("leaves /playlist/<name>/<token> alone", async () => {
    const res = await proxy(
      createNextRequest("http://localhost:3000/playlist/foo/bar"),
    );

    expect(res.status).toBe(200);
  });
});

describe("proxy /api/trpc origin check", () => {
  let proxy: typeof import("../proxy").proxy;
  const url = "http://localhost:3000/api/trpc/song.details";
  const call = (
    headers: Record<string, string>,
    method: "POST" | "OPTIONS" = "POST",
  ) => proxy(createNextRequest(url, method, headers));

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../proxy"));
  });

  it("rejects a cross-origin Origin header", async () => {
    const res = await call({
      origin: "https://evil.example",
      host: "localhost:3000",
    });
    expect(res.status).toBe(403);
  });

  it("rejects a cross-origin Referer when Origin is absent", async () => {
    const res = await call({
      referer: "https://evil.example/page",
      host: "localhost:3000",
    });
    expect(res.status).toBe(403);
  });

  it("rejects a malformed Origin instead of throwing", async () => {
    const res = await call({ origin: "not a url", host: "localhost:3000" });
    expect(res.status).toBe(403);
  });

  it("does not let a lookalike host suffix pass", async () => {
    const res = await call({
      origin: "http://localhost:3000.evil.example",
      host: "localhost:3000",
    });
    expect(res.status).toBe(403);
  });

  it("accepts same-origin Origin and Referer", async () => {
    const withOrigin = await call({
      origin: "http://localhost:3000",
      host: "localhost:3000",
    });
    const withReferer = await call({
      referer: "http://localhost:3000/search?q=x",
      host: "localhost:3000",
    });
    expect(withOrigin.status).toBe(200);
    expect(withReferer.status).toBe(200);
  });

  it("passes OPTIONS preflight through without an origin check", async () => {
    const res = await call({ origin: "https://evil.example" }, "OPTIONS");
    expect(res.status).toBe(200);
  });

  it("currently allows requests with neither Origin nor Referer (ISSUE-010)", async () => {
    const res = await call({ host: "localhost:3000" });
    expect(res.status).toBe(200);
  });
});
