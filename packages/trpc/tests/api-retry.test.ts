import { describe, expect, it } from "bun:test";

import { api, REVALIDATE_SECONDS, revalidateSeconds } from "../src/lib/api";
import { endpoints } from "../src/lib/endpoints";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("api retry", () => {
  it("retries once on a 5xx and returns the second response", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async () =>
      ++calls === 1 ? json({}, 503) : json({ ok: true });

    expect(await api("retry.5xx", {}, fetchFn)).toEqual({ ok: true });
    expect(calls).toBe(2);
  });

  it("gives up after a second 5xx with BAD_GATEWAY", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      return json({}, 502);
    };

    await expect(api("retry.twice", {}, fetchFn)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
      message: "Upstream returned 502",
    });
    expect(calls).toBe(2);
  });

  it("does not retry a 4xx", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      return json({}, 404);
    };

    await expect(api("retry.4xx", {}, fetchFn)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
    expect(calls).toBe(1);
  });

  it("does not retry an invalid JSON body", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      return new Response("nope", { status: 200 });
    };

    await expect(api("retry.json", {}, fetchFn)).rejects.toMatchObject({
      message: "Invalid JSON response from upstream",
    });
    expect(calls).toBe(1);
  });

  it("retries a network error once, then maps to BAD_GATEWAY", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      throw new Error("ECONNRESET");
    };

    await expect(api("retry.net", {}, fetchFn)).rejects.toMatchObject({
      code: "BAD_GATEWAY",
      message: "Upstream network failure",
    });
    expect(calls).toBe(2);
  });

  it("maps a hanging fetch to TIMEOUT after two attempts", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        calls++;
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });

    await expect(
      api("retry.timeout", { timeoutMs: 20 }, fetchFn),
    ).rejects.toMatchObject({
      code: "TIMEOUT",
      message: "Upstream request timed out",
    });
    expect(calls).toBe(2);
  });

  it("applies the timeout to the body read too", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async (_url, init) => {
      calls++;
      const signal = init?.signal;
      const body = new ReadableStream({
        start(controller) {
          signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            controller.error(err);
          });
        },
      });
      return new Response(body, { status: 200 });
    };

    await expect(
      api("retry.body", { timeoutMs: 20 }, fetchFn),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(calls).toBe(2);
  });

  it("does not retry when the caller aborts", async () => {
    let calls = 0;
    const controller = new AbortController();
    const fetchFn: typeof fetch = (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        calls++;
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });

    const pending = api("retry.caller", { signal: controller.signal }, fetchFn);
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(calls).toBe(1);
  });
});

describe("api caching policy", () => {
  it("caches public catalog calls and leaves randomized radio uncached", () => {
    for (const call of [
      endpoints.modules.launch_data,
      endpoints.get.charts,
      endpoints.get.mega_menu,
      endpoints.song.id,
      endpoints.song.recommend,
      endpoints.album.id,
      endpoints.artist.id,
      ...Object.values(endpoints.search),
      endpoints.get.lyrics,
      endpoints.get.actor_top_songs,
      endpoints.get.featured_stations,
    ]) {
      expect(revalidateSeconds(call)).toBeGreaterThan(0);
    }

    const uncached = [...Object.values(endpoints.radio)];
    for (const call of uncached) {
      expect(revalidateSeconds(call)).toBeUndefined();
    }
    for (const call of Object.keys(REVALIDATE_SECONDS)) {
      expect(Object.values(endpoints.radio)).not.toContain(call);
    }
  });

  it("leaves fetch caching to the platform wrapper", async () => {
    const inits: (RequestInit & { next?: unknown })[] = [];
    const fetchFn: typeof fetch = async (_url, init) => {
      inits.push(init ?? {});
      return json({ ok: true });
    };

    await api(endpoints.modules.launch_data, {}, fetchFn);
    await api(endpoints.search.all, { query: { query: "x" } }, fetchFn);

    expect(inits[0]?.next).toBeUndefined();
    expect(inits[1]?.next).toBeUndefined();
  });

  it("keeps radio batches uncached even if the call were allowlisted", async () => {
    let init: (RequestInit & { next?: unknown }) | undefined;
    const fetchFn: typeof fetch = async (_url, i) => {
      init = i;
      return json({ ok: true });
    };

    await api(endpoints.radio.get_song, { cache: false }, fetchFn);
    expect(init?.next).toBeUndefined();
    expect(revalidateSeconds(endpoints.song.id, false)).toBeUndefined();
  });

  it("does not send cookies or user headers beyond the language cookie", async () => {
    let headers: Headers | undefined;
    const fetchFn: typeof fetch = async (_url, init) => {
      headers = new Headers(init?.headers);
      return json({ ok: true });
    };

    await api(endpoints.get.charts, { language: "tamil" }, fetchFn);
    expect(headers?.get("cookie")).toBe(
      "L=tamil; gdpr_acceptance=true; DL=english",
    );
  });
});
