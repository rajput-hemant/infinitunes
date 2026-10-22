import { beforeEach, describe, expect, it, mock } from "bun:test";

let sessionCalls = 0;
const mockGetSession = mock(async () => {
  sessionCalls++;
  return null;
});

const mockCachedApi = mock(async () => {
  return [];
});

mock.module("server-only", () => ({}));
mock.module("~/lib/auth", () => ({ getSession: mockGetSession }));
mock.module("~/lib/cached-api", () => ({ cachedApi: mockCachedApi }));
mock.module("@infinitunes/db", () => ({ db: {} }));

const { GET } = await import("../../app/api/trpc/[trpc]/route");

describe("tRPC route handler (S-10, S-11, S-12)", () => {
  beforeEach(() => {
    sessionCalls = 0;
    mockGetSession.mockClear();
    mockCachedApi.mockClear();
  });

  it("S-11: does not await getSession for public catalog requests", async () => {
    const req = new Request("http://localhost:3000/api/trpc/search.top");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockCachedApi).toHaveBeenCalled();
    expect(sessionCalls).toBe(0);
  });

  it("S-10: enforces maxBatchSize of 20", async () => {
    // 20 calls in batch should succeed
    const paths20 = Array.from({ length: 20 }, () => "search.top").join(",");
    const req20 = new Request(
      `http://localhost:3000/api/trpc/${paths20}?batch=1`,
    );
    const res20 = await GET(req20);
    expect(res20.status).toBe(200);

    // 21 calls in batch should be rejected
    const paths21 = Array.from({ length: 21 }, () => "search.top").join(",");
    const req21 = new Request(
      `http://localhost:3000/api/trpc/${paths21}?batch=1`,
    );
    const res21 = await GET(req21);
    expect(res21.status).toBe(400);
    const body = await res21.json();
    expect(body.error?.json?.message).toBe("Batch call exceeds maximum size");
  });

  it("S-12: logs INTERNAL_SERVER_ERROR in onError", async () => {
    mockCachedApi.mockImplementationOnce(async () => {
      throw new Error("unexpected database crash");
    });

    const errorLogs: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      errorLogs.push(args);
    };

    try {
      const req = new Request("http://localhost:3000/api/trpc/search.top");
      const res = await GET(req);

      expect(res.status).toBe(500);
      expect(errorLogs.length).toBeGreaterThan(0);
      const match = errorLogs.find(
        (args) =>
          typeof args[0] === "string" && args[0].includes("[trpc] search.top"),
      );
      expect(match).toBeDefined();
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("S-12: does not log non-INTERNAL_SERVER_ERROR errors", async () => {
    // Calling an invalid procedure path triggers NOT_FOUND or similar error
    const errorLogs: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      errorLogs.push(args);
    };

    try {
      const req = new Request(
        "http://localhost:3000/api/trpc/nonexistentProcedure",
      );
      const res = await GET(req);

      expect(res.status).toBe(404);
      const internalLogs = errorLogs.filter(
        (args) => typeof args[0] === "string" && args[0].startsWith("[trpc]"),
      );
      expect(internalLogs.length).toBe(0);
    } finally {
      console.error = originalConsoleError;
    }
  });
});
