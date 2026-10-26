import { afterEach, describe, expect, it, mock } from "bun:test";

import * as realApi from "@infinitunes/trpc/api";

import { stubFetch } from "../fetch-stub";

// Snapshot before mocking: the namespace is live and would point back at the mock.
const real = { ...realApi };
const { isTransientUpstreamError } = real;

// `use cache` serializes a thrown error across the cache scope: only name, message and `digest`
// survive, the TRPCError class and `code` do not. Bun does not transform "use cache", so the
// thrown error is wrapped to behave like that clone once `catalogRequest` has set its digest.
const targets = new WeakMap<object, Error>();
function crossCacheBoundary(error: unknown): unknown {
  if (!(error instanceof Error)) return error;
  let clone: Error | undefined;
  const view = () => {
    clone ??= Object.assign(structuredClone(error), {
      digest: (error as { digest?: unknown }).digest,
    });
    return clone;
  };
  const serialized = () => "digest" in error;
  const proxy = new Proxy(error, {
    get: (target, key) =>
      serialized() ? Reflect.get(view(), key) : Reflect.get(target, key),
    has: (target, key) =>
      serialized() ? Reflect.has(view(), key) : Reflect.has(target, key),
    getPrototypeOf: (target) =>
      serialized() ? Error.prototype : Reflect.getPrototypeOf(target),
  });
  targets.set(proxy, error);
  return proxy;
}

mock.module("@infinitunes/trpc/api", () => ({
  ...real,
  // The transient mark lives in a WeakSet keyed by the original error, not the wrapper.
  isTransientUpstreamError: (error: unknown) =>
    real.isTransientUpstreamError(targets.get(error as object) ?? error),
  api: (async (...args: Parameters<typeof real.api>) => {
    try {
      return await real.api(...args);
    } catch (error) {
      throw crossCacheBoundary(error);
    }
  }) as typeof real.api,
}));

const lives: unknown[] = [];
const tags: string[][] = [];
mock.module("next/cache", () => ({
  cacheLife: (life: unknown) => lives.push(life),
  cacheTag: (...values: string[]) => tags.push(values),
}));
const { cachedApi } = await import("../../lib/cached-api");
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  lives.length = 0;
  tags.length = 0;
});

describe("catalog cache boundary", () => {
  it("normalizes endpoint arguments and language before entering the cache", async () => {
    const urls: string[] = [];
    globalThis.fetch = stubFetch(async (url) => {
      urls.push(String(url));
      return Response.json({ ok: true });
    });
    await cachedApi("content.getCharts", {
      query: { n: 20, p: 1, unused: undefined },
      language: " tamil,invalid ",
    });
    await cachedApi("content.getCharts", {
      query: { p: "1", n: "20" },
      language: "tamil",
    });
    await cachedApi("content.getCharts", {
      query: { p: 2, n: 20 },
      language: "tamil",
    });
    await cachedApi("content.getAlbums", {
      query: { p: 1, n: 20 },
      language: "tamil",
    });
    expect(urls[0]).toBe(urls[1]);
    expect(urls[2]).not.toBe(urls[0]);
    expect(urls[3]).not.toBe(urls[0]);
    // Charts carry no media URLs, so the entry may be served stale for a day.
    expect(lives[0]).toEqual({ stale: 600, revalidate: 600, expire: 86_400 });
    expect(tags[0]).toEqual(["catalog", "catalog:content.getCharts"]);
  });

  it("keeps menus for a day beyond their hourly revalidation", async () => {
    globalThis.fetch = stubFetch(async () => Response.json({}));
    await cachedApi("webapi.getBrowseHoverDetails");
    expect(lives).toEqual([{ stale: 3600, revalidate: 3600, expire: 86_400 }]);
  });

  it("expires media-bearing details with their revalidate window", async () => {
    globalThis.fetch = stubFetch(async () => Response.json({}));
    await cachedApi("song.getDetails");
    expect(lives).toEqual([{ stale: 600, revalidate: 600, expire: 600 }]);
  });

  it("bypasses the cache for radio, explicit opt-outs and caller signals", async () => {
    globalThis.fetch = stubFetch(async () => Response.json({}));
    await cachedApi("webradio.getSong");
    await cachedApi("song.getDetails", { cache: false });
    await cachedApi("song.getDetails", {
      signal: new AbortController().signal,
    });
    expect(lives).toEqual([]);
  });

  it("preserves transient BAD_GATEWAY and recovers on the next call", async () => {
    let calls = 0;
    globalThis.fetch = stubFetch(async () => {
      calls++;
      return calls <= 2
        ? Response.json({}, { status: 503 })
        : Response.json({ recovered: true });
    });
    try {
      await cachedApi("song.getDetails");
      throw new Error("expected an upstream error");
    } catch (error) {
      expect(error).toMatchObject({
        code: "BAD_GATEWAY",
        message: "Upstream returned 503",
      });
      expect(isTransientUpstreamError(error)).toBe(true);
    }
    expect(await cachedApi<unknown>("song.getDetails")).toEqual({
      recovered: true,
    });
    expect(calls).toBe(3);
  });

  it("preserves TIMEOUT and nontransient invalid JSON classification", async () => {
    globalThis.fetch = stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    await expect(
      cachedApi("song.getDetails", { timeoutMs: 5 }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    globalThis.fetch = stubFetch(async () => new Response("invalid"));
    try {
      await cachedApi("song.getDetails");
      throw new Error("expected invalid JSON");
    } catch (error) {
      expect(error).toMatchObject({
        code: "BAD_GATEWAY",
        message: "Invalid JSON response from upstream",
      });
      expect(isTransientUpstreamError(error)).toBe(false);
    }
  });
});
