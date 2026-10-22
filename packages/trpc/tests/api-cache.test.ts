import { describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

import {
  api,
  API_DEFAULTS,
  expireSeconds,
  revalidateSeconds,
} from "../src/lib/api";
import { endpoints } from "../src/lib/endpoints";
import { appRouter } from "../src/root";
import { createCallerFactory } from "../src/trpc";

describe("raw API transport", () => {
  it("routes public catalog calls through the injected API without resolving a session", async () => {
    let calls = 0;
    let sessions = 0;
    const fetchFn: typeof fetch = async () => {
      calls++;
      return Response.json([]);
    };
    const caller = createCallerFactory(appRouter)({
      db,
      session: async () => {
        sessions++;
        return null;
      },
      catalogApi: (call, options) => api(call, options, fetchFn),
    });
    expect(await caller.get.charts({ page: 1, n: 1 })).toEqual([]);
    expect(calls).toBe(1);
    expect(sessions).toBe(0);
  });
  it("does not retain responses in a process cache", async () => {
    let calls = 0;
    const fetchFn: typeof fetch = async () => Response.json({ count: ++calls });
    expect(await api(endpoints.get.charts, {}, fetchFn)).toEqual({ count: 1 });
    expect(await api(endpoints.get.charts, {}, fetchFn)).toEqual({ count: 2 });
  });

  it("exports and applies API_DEFAULTS for version, timeout and language", async () => {
    expect(API_DEFAULTS).toEqual({
      isVersion4: true,
      timeoutMs: 10_000,
      language: "hindi,english",
    });

    let requestedUrl = "";
    let requestedCookie = "";
    const fetchFn: typeof fetch = async (url, init) => {
      requestedUrl = String(url);
      requestedCookie = String(new Headers(init?.headers).get("cookie") ?? "");
      return Response.json({});
    };

    await api(endpoints.get.charts, {}, fetchFn);
    expect(requestedUrl).toContain("api_version=4");
    expect(requestedCookie).toContain(`L=${API_DEFAULTS.language}`);
  });

  it("keeps encrypted-media detail lifetimes at most ten minutes", () => {
    for (const call of [
      endpoints.song.id,
      endpoints.song.link,
      endpoints.album.id,
      endpoints.playlist.id,
    ]) {
      expect(revalidateSeconds(call)).toBe(600);
    }
    expect(revalidateSeconds(endpoints.get.mega_menu)).toBe(3600);
    expect(revalidateSeconds(endpoints.get.footer_details)).toBe(3600);
    expect(revalidateSeconds(endpoints.album.same_year)).toBe(3600);
  });

  it("lets media-free payloads outlive revalidation, but not media-bearing ones", () => {
    for (const call of [
      endpoints.get.mega_menu,
      endpoints.get.footer_details,
      endpoints.album.same_year,
      endpoints.search.all,
      endpoints.search.top_search,
      endpoints.get.charts,
    ]) {
      expect(expireSeconds(call)).toBeGreaterThan(revalidateSeconds(call) ?? 0);
    }
    for (const call of [
      endpoints.song.id,
      endpoints.song.link,
      endpoints.song.recommend,
      endpoints.album.id,
      endpoints.playlist.id,
      endpoints.search.songs,
      endpoints.modules.launch_data,
      endpoints.get.trending,
    ]) {
      expect(expireSeconds(call)).toBe(revalidateSeconds(call));
    }
    expect(expireSeconds(endpoints.radio.get_song)).toBeUndefined();
    expect(expireSeconds(endpoints.get.charts, false)).toBeUndefined();
  });
});
