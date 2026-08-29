import { beforeEach, describe, expect, it } from "bun:test";

import {
  api,
  apiCacheSize,
  CACHE_MAX_ENTRIES,
  clearApiCache,
} from "../src/lib/api";

const okFetch: typeof fetch = (async () =>
  new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;

describe("api response cache", () => {
  beforeEach(() => {
    clearApiCache();
  });

  it("serves a repeated call from cache without hitting upstream twice", async () => {
    let calls = 0;
    const countingFetch: typeof fetch = (async () => {
      calls++;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await api("cache.hit", { query: { q: "same" } }, countingFetch);
    await api("cache.hit", { query: { q: "same" } }, countingFetch);

    expect(calls).toBe(1);
    expect(apiCacheSize()).toBe(1);
  });

  it("never grows past CACHE_MAX_ENTRIES for distinct keys", async () => {
    for (let i = 0; i < CACHE_MAX_ENTRIES + 120; i++) {
      await api("cache.bound", { query: { q: `key-${i}` } }, okFetch);
    }

    expect(apiCacheSize()).toBe(CACHE_MAX_ENTRIES);
  });

  it("evicts the least recently used key first", async () => {
    let calls = 0;
    const countingFetch: typeof fetch = (async () => {
      calls++;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    await api("cache.lru", { query: { q: "oldest" } }, countingFetch);
    for (let i = 0; i < CACHE_MAX_ENTRIES - 1; i++) {
      await api("cache.lru", { query: { q: `filler-${i}` } }, countingFetch);
    }
    // Re-reading the oldest key refreshes its recency, so the next insert must
    // evict a filler instead.
    await api("cache.lru", { query: { q: "oldest" } }, countingFetch);
    const callsBefore = calls;
    await api("cache.lru", { query: { q: "overflow" } }, countingFetch);

    expect(apiCacheSize()).toBe(CACHE_MAX_ENTRIES);
    // one new upstream call for "overflow" only; "oldest" was a cache hit
    expect(calls).toBe(callsBefore + 1);

    await api("cache.lru", { query: { q: "oldest" } }, countingFetch);
    expect(calls).toBe(callsBefore + 1);

    await api("cache.lru", { query: { q: "filler-0" } }, countingFetch);
    expect(calls).toBe(callsBefore + 2);
  });

  it("aborts on the caller signal even without AbortSignal.any", async () => {
    const original = AbortSignal.any;
    // @ts-expect-error - simulate a runtime without AbortSignal.any
    delete AbortSignal.any;

    try {
      const controller = new AbortController();
      const hangingFetch: typeof fetch = ((_url: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        })) as typeof fetch;

      const pending = api(
        "cache.abort",
        { query: { q: "abort" }, signal: controller.signal },
        hangingFetch,
      );
      controller.abort();

      expect(pending).rejects.toThrow("Upstream request timed out");
    } finally {
      AbortSignal.any = original;
    }
  });
});
