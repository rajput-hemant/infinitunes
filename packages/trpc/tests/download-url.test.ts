import { beforeAll, describe, expect, it } from "bun:test";

// `createDownloadLinks` reads JIOSAAVN_DES_KEY at module-eval time, so the key
// has to exist before the router graph is imported below.
process.env.JIOSAAVN_DES_KEY ??= "38346591";

type Caller = {
  song: { recommendations: (i: unknown) => Promise<unknown> };
  artist: { topSongs: (i: unknown) => Promise<unknown> };
  search: { byType: (i: unknown) => Promise<unknown> };
  get: {
    trending: (i: unknown) => Promise<unknown>;
    actorTopSongs: (i: unknown) => Promise<unknown>;
    mix: (i: unknown) => Promise<unknown>;
    label: (i: unknown) => Promise<unknown>;
  };
};

const MEDIA_URL = "https://aac.saavncdn.com/test/track_96.mp4";

let caller: Caller;
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

function downloadUrlOf(item: unknown) {
  return (item as { download_url?: string }).download_url;
}

beforeAll(async () => {
  const { createCipheriv } = await import("node:crypto");
  const cipher = createCipheriv(
    "des-ecb",
    Buffer.from(process.env.JIOSAAVN_DES_KEY!, "utf8"),
    null,
  );
  encryptedMediaUrl = Buffer.concat([
    cipher.update(Buffer.from(MEDIA_URL, "utf8")),
    cipher.final(),
  ]).toString("base64");

  globalThis.fetch = ((input: string | URL) => {
    const call = new URL(String(input)).searchParams.get("__call") ?? "";
    if (!(call in responses)) {
      throw new Error(`unexpected upstream call: ${call}`);
    }
    return Promise.resolve(
      new Response(JSON.stringify(responses[call]), { status: 200 }),
    );
  }) as typeof fetch;

  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  caller = createCallerFactory(appRouter)({}) as unknown as Caller;
});

describe("createDownloadLinks round-trip", () => {
  it("decrypts into one comma-separated URL per bitrate", async () => {
    const { createDownloadLinks } = await import("../src/lib/download");
    expect(createDownloadLinks(encryptedMediaUrl).split(",")).toEqual([
      "https://aac.saavncdn.com/test/track_12.mp4",
      "https://aac.saavncdn.com/test/track_48.mp4",
      "https://aac.saavncdn.com/test/track_96.mp4",
      "https://aac.saavncdn.com/test/track_160.mp4",
      "https://aac.saavncdn.com/test/track_320.mp4",
    ]);
  });

  it("replaces the bitrate already present instead of appending it", async () => {
    const { createDownloadLinks } = await import("../src/lib/download");
    expect(createDownloadLinks(encryptedMediaUrl)).not.toContain("_96_");
  });
});

describe("every song-returning procedure attaches download_url", () => {
  it("song.recommendations", async () => {
    responses = { "reco.getreco": [song("s1")] };
    const result = (await caller.song.recommendations({
      id: uniq(),
    })) as unknown[];
    expect(downloadUrlOf(result[0])).toContain("_320.mp4");
  });

  it("artist.topSongs (pre-existing reference behaviour)", async () => {
    responses = { "search.artistOtherTopSongs": [song("s2")] };
    const result = (await caller.artist.topSongs({
      artist_id: uniq(),
      song_id: "s2",
    })) as unknown[];
    expect(downloadUrlOf(result[0])).toContain("_320.mp4");
  });

  it("get.actorTopSongs", async () => {
    responses = { "search.actorOtherTopSongs": [song("s3")] };
    const result = (await caller.get.actorTopSongs({
      actor_id: uniq(),
      song_id: "s3",
    })) as unknown[];
    expect(downloadUrlOf(result[0])).toContain("_320.mp4");
  });

  it("get.trending", async () => {
    responses = { "content.getTrending": [song("s4")] };
    const result = (await caller.get.trending({
      lang: "hindi",
      type: "song",
    })) as unknown[];
    expect(downloadUrlOf(result[0])).toContain("_320.mp4");
  });

  it("get.mix maps its list array", async () => {
    responses = { "webapi.get": { id: "m1", list: [song("s5")] } };
    const result = (await caller.get.mix({ token: uniq() })) as {
      list: unknown[];
    };
    expect(downloadUrlOf(result.list[0])).toContain("_320.mp4");
  });

  it("get.label maps its topSongs.songs array", async () => {
    responses = {
      "webapi.get": { labelId: "l1", topSongs: { songs: [song("s6")] } },
    };
    const result = (await caller.get.label({ token: uniq() })) as {
      topSongs: { songs: unknown[] };
    };
    expect(downloadUrlOf(result.topSongs.songs[0])).toContain("_320.mp4");
  });

  it("search.byType maps song results", async () => {
    responses = { "search.getResults": { results: [song("s7")] } };
    const result = (await caller.search.byType({
      type: "songs",
      q: uniq(),
    })) as { results: unknown[] };
    expect(downloadUrlOf(result.results[0])).toContain("_320.mp4");
  });

  it("search.byType leaves non-song results untouched", async () => {
    responses = {
      "search.getAlbumResults": { results: [{ id: "a1", title: "Album" }] },
    };
    const result = (await caller.search.byType({
      type: "albums",
      q: uniq(),
    })) as { results: unknown[] };
    expect(downloadUrlOf(result.results[0])).toBeUndefined();
  });
});
