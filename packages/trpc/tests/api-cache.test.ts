import { describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

import { api, revalidateSeconds } from "../src/lib/api";
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
});
