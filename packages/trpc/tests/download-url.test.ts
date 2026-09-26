import { beforeAll, describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

process.env.JIOSAAVN_DES_KEY ??= "38346591";

async function createTestCaller() {
  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  return createCallerFactory(appRouter)({ db, session: null });
}

const MEDIA_URL = "https://aac.saavncdn.com/test/track_96.mp4";

let caller: Awaited<ReturnType<typeof createTestCaller>>;
let encryptedMediaUrl: string;
/** Upstream `__call` value -> JSON body, set per test. */
let responses: Record<string, unknown> = {};

/** Distinct query per test so the 60s in-memory api cache never cross-talks. */
let seq = 0;
const uniq = () => `fixture-${++seq}`;

function song(id: string) {
  return {
    id,
    title: "Test Song",
    type: "song",
    image: "https://c.saavncdn.com/1/Test-Hindi-2024-20240101-150x150.jpg",
    more_info: { duration: "180", encrypted_media_url: encryptedMediaUrl },
  };
}

function downloadUrl(item: object | undefined): string | undefined {
  if (item && "download_url" in item && typeof item.download_url === "string") {
    return item.download_url;
  }
  return undefined;
}

beforeAll(async () => {
  // Known sample: MEDIA_URL encrypted with DES-ECB under JIOSAAVN_DES_KEY.
  // Hardcoded so this test never depends on `node:crypto` single-DES, which
  // Node 22 / OpenSSL 3 removed (ERR_OSSL_EVP_UNSUPPORTED). The vector was
  // produced by an independent implementation (Bun's OpenSSL-backed crypto)
  // and cross-checked against the NIST FIPS-81 answer
  // (key 133457799BBCDFF1, pt 0123456789ABCDEF -> ct 85E813540F0AB405).
  encryptedMediaUrl =
    "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyV2VjdQb8kXx4TUDOuYJm42+XHLUinhCK";

  globalThis.fetch = async (input) => {
    const call = new URL(String(input)).searchParams.get("__call") ?? "";
    if (!(call in responses)) {
      throw new Error(`unexpected upstream call: ${call}`);
    }
    return new Response(JSON.stringify(responses[call]), { status: 200 });
  };

  caller = await createTestCaller();
});

describe("createDownloadLinks round-trip", () => {
  it("decrypts into one comma-separated URL per bitrate", async () => {
    const { createDownloadLinks } = await import("../src/lib/download");
    const base = MEDIA_URL.replace(/_(?:12|48|96|160|320)\.\w+$/, "");
    expect(createDownloadLinks(encryptedMediaUrl).split(",")).toEqual(
      ["_12", "_48", "_96", "_160", "_320"].map((id) => `${base}${id}.mp4`),
    );
  });

  it("replaces the bitrate already present instead of appending it", async () => {
    const { createDownloadLinks } = await import("../src/lib/download");
    expect(createDownloadLinks(encryptedMediaUrl)).not.toContain("_96_");
  });
});

describe("every song-returning procedure attaches download_url", () => {
  it("song.recommendations", async () => {
    responses = { "reco.getreco": [song("s1")] };
    const result = await caller.song.recommendations({ id: uniq() });
    expect(result[0]?.download_url).toContain("_320.mp4");
  });

  it("artist.topSongs (pre-existing reference behaviour)", async () => {
    responses = { "search.artistOtherTopSongs": [song("s2")] };
    const result = await caller.artist.topSongs({
      artist_id: uniq(),
      song_id: "s2",
    });
    expect(result[0]?.download_url).toContain("_320.mp4");
  });

  it("get.actorTopSongs", async () => {
    responses = { "search.actorOtherTopSongs": [song("s3")] };
    const result = await caller.get.actorTopSongs({
      actor_id: uniq(),
      song_id: "s3",
    });
    expect(result[0]?.download_url).toContain("_320.mp4");
  });

  it("get.trending", async () => {
    responses = { "content.getTrending": [song("s4")] };
    const result = await caller.get.trending({
      lang: "hindi",
      type: "song",
    });
    expect(downloadUrl(result[0])).toContain("_320.mp4");
  });

  it("get.mix maps its list array", async () => {
    responses = { "webapi.get": { id: "m1", list: [song("s5")] } };
    const result = await caller.get.mix({ token: uniq() });
    expect(result.list[0]?.download_url).toContain("_320.mp4");
  });

  it("get.label maps its topSongs.songs array", async () => {
    responses = {
      "webapi.get": { labelId: "l1", topSongs: { songs: [song("s6")] } },
    };
    const result = await caller.get.label({ token: uniq() });
    expect(result.topSongs.songs[0]?.download_url).toContain("_320.mp4");
  });

  it("search.byType maps song results", async () => {
    responses = { "search.getResults": { results: [song("s7")] } };
    const result = await caller.search.byType({
      type: "songs",
      q: uniq(),
    });
    expect(downloadUrl(result.results[0])).toContain("_320.mp4");
  });

  it("search.byType leaves non-song results untouched", async () => {
    responses = {
      "search.getAlbumResults": { results: [{ id: "a1", title: "Album" }] },
    };
    const result = await caller.search.byType({
      type: "albums",
      q: uniq(),
    });
    expect(downloadUrl(result.results[0])).toBeUndefined();
  });
});
