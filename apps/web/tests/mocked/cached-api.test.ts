import { afterEach, describe, expect, it, mock } from "bun:test";

import { isTransientUpstreamError } from "@infinitunes/trpc/api";

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
    globalThis.fetch = async (url) => {
      urls.push(String(url));
      return Response.json({ ok: true });
    };
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
    expect(lives[0]).toEqual({ stale: 600, revalidate: 600, expire: 600 });
    expect(tags[0]).toEqual(["catalog", "catalog:content.getCharts"]);
  });

  it("uses a one-hour hard expiry for menus", async () => {
    globalThis.fetch = async () => Response.json({});
    await cachedApi("webapi.getBrowseHoverDetails");
    expect(lives).toEqual([{ stale: 3600, revalidate: 3600, expire: 3600 }]);
  });

  it("bypasses the cache for radio, explicit opt-outs and caller signals", async () => {
    globalThis.fetch = async () => Response.json({});
    await cachedApi("webradio.getSong");
    await cachedApi("song.getDetails", { cache: false });
    await cachedApi("song.getDetails", {
      signal: new AbortController().signal,
    });
    expect(lives).toEqual([]);
  });

  it("preserves transient BAD_GATEWAY and recovers on the next call", async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return calls <= 2
        ? Response.json({}, { status: 503 })
        : Response.json({ recovered: true });
    };
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
    expect(await cachedApi("song.getDetails")).toEqual({ recovered: true });
    expect(calls).toBe(3);
  });

  it("preserves TIMEOUT and nontransient invalid JSON classification", async () => {
    globalThis.fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    await expect(
      cachedApi("song.getDetails", { timeoutMs: 5 }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    globalThis.fetch = async () => new Response("invalid");
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
