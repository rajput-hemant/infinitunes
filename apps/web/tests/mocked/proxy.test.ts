import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";

import * as betterAuthCookies from "better-auth/cookies";
import type { NextRequest } from "next/server";

const fromEnv = mock(() => ({}) as never);

const getSessionCookie = mock(() => undefined as string | undefined);

const seenKeys: string[] = [];
let limitSuccess = true;

mock.module("@upstash/redis", () => ({
  Redis: { fromEnv },
}));

mock.module("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = () => ({});
    limit = async (id: string) => {
      seenKeys.push(id);
      return {
        limit: 50,
        pending: Promise.resolve(),
        remaining: limitSuccess ? 49 : 0,
        reset: Date.now(),
        success: limitSuccess,
      };
    };
  },
}));

mock.module("better-auth/cookies", () => ({
  ...betterAuthCookies,
  getSessionCookie,
}));

mock.module("next/server", () => ({
  NextResponse: {
    next: () => ({ status: 200, headers: new Headers() }),
    json: (_body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
    }),
    redirect: (url: URL) => ({ status: 307, headers: { location: url.href } }),
  },
}));

process.env.SKIP_ENV_VALIDATION = "true";
// Rate limiting ON for this file so the limiter path is exercised; the
// Upstash clients are fully mocked (no network). `env` snapshots at import,
// so per-test toggling cannot work: every suite below runs with the limiter
// enabled and a succeeding bucket unless stated.
process.env.ENABLE_RATE_LIMITING = "true";
// Client IP headers are only trusted behind a configured proxy (see client-ip).
process.env.TRUSTED_PROXY = "vercel";
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
  method: "GET" | "HEAD" | "POST" | "OPTIONS" = "GET",
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
  let proxy: typeof import("../../proxy").proxy;

  beforeAll(async () => {
    ({ proxy } = await import("../../proxy"));
  });

  it("constructs Redis.fromEnv lazily and only once", async () => {
    expect(fromEnv).not.toHaveBeenCalled();
    await proxy(createNextRequest("http://localhost:3000/"));
    await proxy(createNextRequest("http://localhost:3000/"));
    expect(fromEnv).toHaveBeenCalledTimes(1);
  });
});

describe("proxy guest route access", () => {
  let proxy: typeof import("../../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../../proxy"));
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

describe("proxy auth routes with a session cookie", () => {
  let proxy: typeof import("../../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => "stale-or-valid-token");
    ({ proxy } = await import("../../proxy"));
  });

  // The proxy cannot tell a valid session from a stale cookie; redirecting here
  // locked users with an expired session out of /login. The (auth) layout
  // redirects real sessions instead.
  for (const path of [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ]) {
    it(`does not redirect ${path}`, async () => {
      const res = await proxy(
        createNextRequest(`http://localhost:3000${path}`),
      );

      expect(res.status).toBe(200);
    });
  }
});

describe("proxy detail route normalization", () => {
  let proxy: typeof import("../../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../../proxy"));
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
  let proxy: typeof import("../../proxy").proxy;
  const url = "http://localhost:3000/api/trpc/song.details";
  const call = (
    headers: Record<string, string>,
    method: "GET" | "HEAD" | "POST" | "OPTIONS" = "POST",
  ) => proxy(createNextRequest(url, method, headers));

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../../proxy"));
  });

  it("rejects a cross-origin Origin header", async () => {
    const res = await call({
      origin: "https://evil.example",
      host: "localhost:3000",
    });
    expect(res.status).toBe(403);
  });

  it("rejects a non-GET with only a same-origin Referer (Origin required)", async () => {
    const res = await call({
      referer: "http://localhost:3000/search?q=x",
      host: "localhost:3000",
    });
    expect(res.status).toBe(403);
  });

  it("rejects a cross-origin Referer", async () => {
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

  it("rejects a non-GET with neither Origin nor Referer", async () => {
    const res = await call({ host: "localhost:3000" });
    expect(res.status).toBe(403);
  });

  it("accepts a same-origin Origin on POST", async () => {
    const res = await call({
      origin: "http://localhost:3000",
      host: "localhost:3000",
    });
    expect(res.status).toBe(200);
  });

  it("accepts the request's own https host behind a custom domain", async () => {
    const res = await proxy(
      createNextRequest(
        "https://music.example.com/api/trpc/song.details",
        "POST",
        { origin: "https://music.example.com", host: "music.example.com" },
      ),
    );
    expect(res.status).toBe(200);
  });

  it("lets GET and HEAD without Origin or Referer through", async () => {
    expect((await call({ host: "localhost:3000" }, "GET")).status).toBe(200);
    expect((await call({ host: "localhost:3000" }, "HEAD")).status).toBe(200);
  });

  it("still rejects a cross-origin GET and accepts a same-origin Referer GET", async () => {
    const bad = await call(
      { origin: "https://evil.example", host: "localhost:3000" },
      "GET",
    );
    const ok = await call(
      { referer: "http://localhost:3000/x", host: "localhost:3000" },
      "GET",
    );
    expect(bad.status).toBe(403);
    expect(ok.status).toBe(200);
  });

  it("passes OPTIONS preflight through without an origin check", async () => {
    const res = await call({ origin: "https://evil.example" }, "OPTIONS");
    expect(res.status).toBe(200);
  });
});

describe("proxy rate-limit client key (SE-4)", () => {
  let proxy: typeof import("../../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../../proxy"));
  });

  it("keys by x-real-ip first, then the first forwarded entry, trimmed", async () => {
    seenKeys.length = 0;
    await proxy(
      createNextRequest("http://localhost:3000/", "GET", {
        "x-real-ip": " 203.0.113.7 ",
        "x-forwarded-for": "198.51.100.9, 203.0.113.1",
      }),
    );
    await proxy(
      createNextRequest("http://localhost:3000/", "GET", {
        "x-forwarded-for": " 198.51.100.9 , 203.0.113.1",
      }),
    );
    expect(seenKeys).toEqual(["203.0.113.7", "198.51.100.9"]);
  });

  it("returns 429 without leaking the key when the bucket is empty", async () => {
    limitSuccess = false;
    try {
      const res = (await proxy(
        createNextRequest("http://localhost:3000/", "GET", {
          "x-forwarded-for": "198.51.100.9",
        }),
      )) as { status: number };
      expect(res.status).toBe(429);
    } finally {
      limitSuccess = true;
    }
  });
});

describe("proxy CSP report-only header", () => {
  let proxy: typeof import("../../proxy").proxy;
  const read = (res: unknown, name: string) =>
    (res as { headers: Headers }).headers.get(name);

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../../proxy"));
  });

  it("sets a report-only CSP with a fresh nonce on page responses", async () => {
    const first = await proxy(createNextRequest("http://localhost:3000/"));
    const second = await proxy(createNextRequest("http://localhost:3000/"));
    const header = "content-security-policy-report-only";

    expect(read(first, header)).toMatch(/script-src 'self' 'nonce-[^']+'/);
    expect(read(first, header)).not.toBe(read(second, header));
    expect(read(first, "content-security-policy")).toBeNull();
  });

  it("does not add a CSP to /api/trpc responses", async () => {
    const res = await proxy(
      createNextRequest("http://localhost:3000/api/trpc/song.details", "GET", {
        host: "localhost:3000",
      }),
    );
    expect(read(res, "content-security-policy-report-only")).toBeNull();
  });
});

describe("proxy /api/auth rate limiting (SE-4)", () => {
  let proxy: typeof import("../../proxy").proxy;

  beforeAll(async () => {
    getSessionCookie.mockImplementation(() => undefined);
    ({ proxy } = await import("../../proxy"));
  });

  it("limits /api/auth and then passes it through without CSP or redirects", async () => {
    seenKeys.length = 0;
    const res = (await proxy(
      createNextRequest("http://localhost:3000/api/auth/get-session", "GET", {
        "x-real-ip": "203.0.113.7",
      }),
    )) as { status: number; headers: Headers };
    expect(seenKeys).toEqual(["203.0.113.7"]);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-security-policy-report-only")).toBeNull();
  });

  it("adds the strict bucket only for credential POSTs", async () => {
    seenKeys.length = 0;
    const headers = { "x-real-ip": "203.0.113.7" };
    await proxy(
      createNextRequest(
        "http://localhost:3000/api/auth/sign-in/email",
        "POST",
        headers,
      ),
    );
    expect(seenKeys).toHaveLength(2);
    seenKeys.length = 0;
    await proxy(
      createNextRequest(
        "http://localhost:3000/api/auth/request-password-reset",
        "POST",
        headers,
      ),
    );
    await proxy(
      createNextRequest(
        "http://localhost:3000/api/auth/sign-in/email",
        "GET",
        headers,
      ),
    );
    expect(seenKeys).toHaveLength(2);
  });

  it("returns 429 on /api/auth when the bucket is empty", async () => {
    limitSuccess = false;
    try {
      const res = (await proxy(
        createNextRequest(
          "http://localhost:3000/api/auth/sign-in/email",
          "POST",
        ),
      )) as { status: number };
      expect(res.status).toBe(429);
    } finally {
      limitSuccess = true;
    }
  });

  it("matches /api/auth in the proxy matcher but not other api routes", async () => {
    const { config } = await import("../../proxy");
    const re = new RegExp(`^${config.matcher[0]}$`);
    expect(re.test("/api/auth/sign-in/email")).toBe(true);
    expect(re.test("/api/trpc/song.details")).toBe(true);
    expect(re.test("/api/og")).toBe(false);
  });
});
