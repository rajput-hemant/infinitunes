import { beforeAll, describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

process.env.JIOSAAVN_DES_KEY ??= "38346591";

const MEDIA_URL = "https://aac.saavncdn.com/test/track_96.mp4";

async function createTestCaller() {
  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  return createCallerFactory(appRouter)({ db, session: null });
}

let caller: Awaited<ReturnType<typeof createTestCaller>>;
let encryptedMediaUrl: string;
/** Upstream `__call` value -> JSON body, set per test. */
let responses: Record<string, unknown> = {};
let calls: string[] = [];
/** Full upstream URLs, in call order. */
let urls: URL[] = [];

function downloadUrl(item: object | undefined): string | undefined {
  if (item && "download_url" in item && typeof item.download_url === "string") {
    return item.download_url;
  }
  return undefined;
}

/** Distinct query per test so the 60s in-memory api cache never cross-talks. */
let seq = 0;
const uniq = () => `fixture-${++seq}`;

function song(id: string) {
  return {
    id,
    title: "Test Song",
    type: "song",
    more_info: {
      album: "Test Album",
      duration: "180",
      encrypted_media_url: encryptedMediaUrl,
    },
  };
}

beforeAll(async () => {
  const desKey = process.env.JIOSAAVN_DES_KEY;
  if (!desKey) throw new Error("JIOSAAVN_DES_KEY is required");
  const { createCipheriv } = await import("node:crypto");
  const cipher = createCipheriv("des-ecb", Buffer.from(desKey, "utf8"), null);
  encryptedMediaUrl = Buffer.concat([
    cipher.update(Buffer.from(MEDIA_URL, "utf8")),
    cipher.final(),
  ]).toString("base64");

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const call = url.searchParams.get("__call") ?? "";
    calls.push(call);
    urls.push(url);
    if (!(call in responses)) {
      throw new Error(`unexpected upstream call: ${call}`);
    }
    return new Response(JSON.stringify(responses[call]), { status: 200 });
  };

  caller = await createTestCaller();
});

describe("router procedures", () => {
  it("search.all asks for API v4, the shape AllSearch describes", async () => {
    urls = [];
    responses = {
      "autocomplete.get": {
        albums: { position: 1, data: [] },
        songs: { position: 2, data: [] },
      },
    };

    await caller.search.all({ q: uniq() });

    // v3 sends `url` instead of `perma_url`, so no result would link.
    expect(urls.map((url) => url.searchParams.get("api_version"))).toEqual([
      "4",
    ]);
  });

  it("home.home returns launch data with processed download URLs", async () => {
    calls = [];
    responses = {
      "webapi.getLaunchData": {
        new_trending: [song("s1")],
        top_playlists: [{ id: "p1", title: "Test Playlist" }],
      },
    };

    const result = await caller.home.home({ lang: "hindi" });
    const trending = result.new_trending[0];

    expect(calls).toEqual(["webapi.getLaunchData"]);
    expect(result.new_trending).toHaveLength(1);
    expect(downloadUrl(trending)).toContain("_320.mp4");
    expect(trending?.more_info.download_url).toBe(downloadUrl(trending));
    expect(result.top_playlists).toHaveLength(1);
  });

  it("song.details handles single and comma-separated ids and processes download URLs", async () => {
    calls = [];
    responses = { "song.getDetails": { songs: [song("s1")] } };

    const single = await caller.song.details({ id: uniq() });

    expect(calls).toEqual(["song.getDetails"]);
    expect(single.songs).toHaveLength(1);
    expect(single.songs[0]?.download_url).toContain("_320.mp4");

    calls = [];
    responses = { "song.getDetails": { songs: [song("s1"), song("s2")] } };

    const pair = await caller.song.details({ id: `${uniq()},${uniq()}` });

    expect(calls).toEqual(["song.getDetails"]);
    expect(pair.songs).toHaveLength(2);
    expect(pair.songs[1]?.download_url).toContain("_320.mp4");
  });

  it("song.items resolves episode and song payloads and processes download URLs", async () => {
    calls = [];
    responses = {
      "song.getDetails": {
        songs: [
          {
            id: "ep1",
            title: "Episode 1",
            type: "episode",
            more_info: {
              duration: "600",
              encrypted_media_url: encryptedMediaUrl,
            },
          },
          song("s2"),
        ],
      },
    };

    const result = await caller.song.items({ id: `${uniq()},${uniq()}` });

    expect(calls).toEqual(["song.getDetails"]);
    expect(result.songs.map((item) => item.type)).toEqual(["episode", "song"]);
  });

  it("album.details returns album payload matching Album shape", async () => {
    const id = uniq();
    calls = [];
    responses = {
      "content.getAlbumDetails": {
        id,
        title: "Test Album",
        list: [song("s1")],
      },
    };

    const result = await caller.album.details({ id });

    expect(calls).toEqual(["content.getAlbumDetails"]);
    expect(result.id).toBe(id);
    expect(result.title).toBe("Test Album");
    expect(Array.isArray(result.list)).toBe(true);
    if (Array.isArray(result.list)) {
      expect(result.list[0]?.download_url).toContain("_320.mp4");
    }
  });

  it("playlist.details returns playlist payload matching Playlist shape", async () => {
    const id = uniq();
    calls = [];
    responses = {
      "playlist.getDetails": {
        id,
        title: "Test Playlist",
        list: [song("s1")],
      },
    };

    const result = await caller.playlist.details({ id });

    expect(calls).toEqual(["playlist.getDetails"]);
    expect(result.id).toBe(id);
    expect(result.title).toBe("Test Playlist");
    expect(Array.isArray(result.list)).toBe(true);
    if (!Array.isArray(result.list)) return;
    expect(result.list[0]?.download_url).toContain("_320.mp4");
  });

  it("artist.details returns artist payload matching Artist shape", async () => {
    const id = uniq();
    calls = [];
    responses = {
      "artist.getArtistPageDetails": {
        artistId: id,
        name: "Artist 1",
        topSongs: [song("s1")],
      },
    };

    const result = await caller.artist.details({ id });

    expect(calls).toEqual(["artist.getArtistPageDetails"]);
    expect(result.artistId).toBe(id);
    expect(result.name).toBe("Artist 1");
    expect(result.topSongs).toHaveLength(1);
    expect(result.topSongs?.[0]?.download_url).toContain("_320.mp4");
  });

  it("song.details supports token lookup via webapi.get", async () => {
    calls = [];
    responses = { "webapi.get": { songs: [song("s1")] } };

    const result = await caller.song.details({ token: uniq() });

    expect(calls).toEqual(["webapi.get"]);
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0]?.id).toBe("s1");
    expect(result.songs[0]?.download_url).toContain("_320.mp4");
  });

  it("artist.details supports token lookup via webapi.get", async () => {
    calls = [];
    responses = {
      "webapi.get": {
        artistId: "ar1",
        name: "Artist 1",
        topSongs: [song("s1")],
      },
    };

    const result = await caller.artist.details({ token: uniq() });

    expect(calls).toEqual(["webapi.get"]);
    expect(result.artistId).toBe("ar1");
    expect(result.name).toBe("Artist 1");
    expect(result.topSongs?.[0]?.download_url).toContain("_320.mp4");
  });

  it("album.details supports token lookup via webapi.get in a single call (S-15)", async () => {
    const id = uniq();
    calls = [];
    responses = {
      "webapi.get": {
        id,
        title: "Test Album",
        list: [song("s1")],
      },
    };

    const result = await caller.album.details({ token: uniq() });

    expect(calls).toEqual(["webapi.get"]);
    expect(result.id).toBe(id);
    expect(result.title).toBe("Test Album");
    expect(Array.isArray(result.list)).toBe(true);
    if (Array.isArray(result.list)) {
      expect(result.list[0]?.download_url).toContain("_320.mp4");
    }
  });

  it("album.details routes numeric token to content.getAlbumDetails (S-15)", async () => {
    const id = "123456";
    calls = [];
    responses = {
      "content.getAlbumDetails": {
        id,
        title: "Numeric Album",
        list: [song("s1")],
      },
    };

    const result = await caller.album.details({ token: id });

    expect(calls).toEqual(["content.getAlbumDetails"]);
    expect(result.id).toBe(id);
  });

  it("playlist.details supports token lookup via webapi.get in a single call (S-15)", async () => {
    const id = uniq();
    calls = [];
    responses = {
      "webapi.get": {
        id,
        title: "Test Playlist",
        list: [song("s1")],
      },
    };

    const result = await caller.playlist.details({ token: uniq() });

    expect(calls).toEqual(["webapi.get"]);
    expect(result.id).toBe(id);
    expect(result.title).toBe("Test Playlist");
    expect(Array.isArray(result.list)).toBe(true);
    if (!Array.isArray(result.list)) return;
    expect(result.list[0]?.download_url).toContain("_320.mp4");
  });

  it("playlist.details routes numeric token to playlist.getDetails (S-15)", async () => {
    const id = "789101";
    calls = [];
    responses = {
      "playlist.getDetails": {
        id,
        title: "Numeric Playlist",
        list: [song("s1")],
      },
    };

    const result = await caller.playlist.details({ token: id });

    expect(calls).toEqual(["playlist.getDetails"]);
    expect(result.id).toBe(id);
  });

  it("get.footer falls back to hindi when lang is omitted (S-14)", async () => {
    urls = [];
    responses = {
      "webapi.getFooterDetails": {
        playlist: [],
        artist: [],
        album: [],
      },
    };

    await caller.get.footer({});
    expect(
      urls
        .find((u) => u.searchParams.get("__call") === "webapi.getFooterDetails")
        ?.searchParams.get("language"),
    ).toBe("hindi");

    urls = [];
    await caller.get.footer({ lang: "english,tamil" });
    expect(
      urls
        .find((u) => u.searchParams.get("__call") === "webapi.getFooterDetails")
        ?.searchParams.get("language"),
    ).toBe("english");
  });
});
