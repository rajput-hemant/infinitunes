import { beforeAll, describe, expect, it, mock } from "bun:test";

const fromEnv = mock(() => {
  throw new Error("Redis.fromEnv must not run when rate limiting is off");
});

mock.module("@upstash/redis", () => ({
  Redis: { fromEnv },
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

describe("proxy Upstash client laziness", () => {
  let proxy: typeof import("../proxy").proxy;

  beforeAll(async () => {
    ({ proxy } = await import("../proxy"));
  });

  it("does not construct Redis.fromEnv when rate limiting is disabled", async () => {
    const nextUrl = new URL("http://localhost:3000/");
    const req = {
      nextUrl,
      method: "GET",
      headers: { get: () => null },
      ip: undefined,
    };

    const res = await proxy(req as never);

    expect(res.status).toBe(200);
    expect(fromEnv).not.toHaveBeenCalled();
  });
});
