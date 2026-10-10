import { beforeAll, describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";
import { TRPCError } from "@trpc/server";

process.env.JIOSAAVN_DES_KEY ??= "38346591";

async function createTestCaller() {
  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  return createCallerFactory(appRouter)({ db, session: null });
}

let caller: Awaited<ReturnType<typeof createTestCaller>>;
/** Upstream `__call` value -> JSON body, set per test. */
let responses: Record<string, unknown> = {};

let seq = 0;
const uniq = () => `empty-${++seq}`;

beforeAll(async () => {
  globalThis.fetch = async (input) => {
    const call = new URL(String(input)).searchParams.get("__call") ?? "";
    if (!(call in responses)) {
      throw new Error(`unexpected upstream call: ${call}`);
    }
    return new Response(JSON.stringify(responses[call]), { status: 200 });
  };

  caller = await createTestCaller();
});

describe("secondary lists return [] instead of throwing NOT_FOUND", () => {
  it("song.recommendations", async () => {
    responses = { "reco.getreco": [] };
    expect(await caller.song.recommendations({ id: uniq() })).toEqual([]);
  });

  it("album.recommendations", async () => {
    responses = { "reco.getAlbumReco": [] };
    expect(await caller.album.recommendations({ id: uniq() })).toEqual([]);
  });

  it("album.sameYear", async () => {
    responses = { "search.topAlbumsoftheYear": [] };
    expect(await caller.album.sameYear({ year: uniq() })).toEqual([]);
  });

  it("playlist.recommendations", async () => {
    responses = { "reco.getPlaylistReco": [] };
    expect(await caller.playlist.recommendations({ id: uniq() })).toEqual([]);
  });

  it("artist.topSongs", async () => {
    responses = { "search.artistOtherTopSongs": [] };
    expect(
      await caller.artist.topSongs({ artist_id: uniq(), song_id: "s1" }),
    ).toEqual([]);
  });

  it("get.actorTopSongs", async () => {
    responses = { "search.actorOtherTopSongs": [] };
    expect(
      await caller.get.actorTopSongs({ actor_id: uniq(), song_id: "s1" }),
    ).toEqual([]);
  });

  it("get.trending, including the unparameterized fallback", async () => {
    responses = { "content.getTrending": [] };
    expect(await caller.get.trending({ lang: uniq(), type: "song" })).toEqual(
      [],
    );
  });

  it("search.top", async () => {
    responses = { "content.getTopSearches": [] };
    expect(await caller.search.top()).toEqual([]);
  });
});

describe("missing primary entities still throw NOT_FOUND", () => {
  it("album.details", async () => {
    responses = { "webapi.get": {}, "content.getAlbumDetails": {} };
    await expect(caller.album.details({ token: uniq() })).rejects.toThrow(
      "No album found",
    );
  });
});

describe("secondary upstream outages", () => {
  for (const code of ["BAD_GATEWAY", "TIMEOUT"] as const) {
    it(`degrades secondary lists on ${code} while primary errors propagate`, async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        if (code === "TIMEOUT")
          throw new DOMException("Timed out", "AbortError");
        throw new Error("Network unreachable");
      };
      try {
        const lists = await Promise.all([
          caller.song.recommendations({ id: uniq() }),
          caller.album.recommendations({ id: uniq() }),
          caller.album.sameYear({ year: uniq() }),
          caller.playlist.recommendations({ id: uniq() }),
          caller.artist.topSongs({ artist_id: uniq(), song_id: "s1" }),
          caller.get.actorTopSongs({ actor_id: uniq(), song_id: "s1" }),
          caller.get.trending({ type: "song" }),
          caller.search.top(),
        ]);
        expect(lists).toEqual(Array.from({ length: 8 }, () => []));
        await expect(caller.song.details({ id: uniq() })).rejects.toMatchObject(
          { code },
        );
        await expect(
          caller.album.details({ id: uniq() }),
        ).rejects.toMatchObject({ code });
        await expect(
          caller.playlist.details({ id: uniq() }),
        ).rejects.toMatchObject({ code });
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  }

  it("keeps persistent 4xx and invalid-JSON BAD_GATEWAY errors visible", async () => {
    const originalFetch = globalThis.fetch;
    try {
      for (const respond of [
        () => new Response("nope", { status: 403 }),
        () => new Response("nope", { status: 404 }),
        () => new Response("<html>", { status: 200 }),
      ]) {
        globalThis.fetch = async () => respond();
        await expect(
          caller.song.recommendations({ id: uniq() }),
        ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("degrades upstream 5xx", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response("down", { status: 503 });
      expect(await caller.song.recommendations({ id: uniq() })).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not hide NOT_FOUND, BAD_REQUEST or non-tRPC errors", async () => {
    const { secondaryList } = await import("../src/router/utils");
    const errors = [
      new TRPCError({ code: "NOT_FOUND" }),
      new TRPCError({ code: "BAD_REQUEST" }),
      new Error("Network unreachable"),
    ];
    for (const error of errors) {
      await expect(secondaryList(() => Promise.reject(error))).rejects.toBe(
        error,
      );
    }
  });

  it("does not hide programming errors in secondary lists", async () => {
    const { secondaryList } = await import("../src/router/utils");
    const error = new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await expect(secondaryList(() => Promise.reject(error))).rejects.toBe(
      error,
    );
  });
});
