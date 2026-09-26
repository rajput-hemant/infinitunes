import { beforeAll, describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

process.env.JIOSAAVN_DES_KEY ??= "38346591";

async function createTestCaller() {
  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  return createCallerFactory(appRouter)({ db, session: null });
}

let caller: Awaited<ReturnType<typeof createTestCaller>>;
/** Upstream `__call` value -> JSON body, set per test. */
let responses: Record<string, unknown> = {};

/** Distinct query per test so the in-memory api cache never cross-talks. */
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
    expect(await caller.search.top({})).toEqual([]);
  });
});

describe("missing primary entities still throw NOT_FOUND", () => {
  it("album.details", async () => {
    responses = { "webapi.get": {}, "content.getAlbumDetails": {} };
    expect(caller.album.details({ token: uniq() })).rejects.toThrow(
      "No album found",
    );
  });
});
