import { beforeAll, describe, expect, it } from "bun:test";

// `createDownloadLinks` reads JIOSAAVN_DES_KEY at module-eval time, so the key
// has to exist before the router graph is imported below.
process.env.JIOSAAVN_DES_KEY ??= "38346591";

type Caller = {
  home: { home: (i: unknown) => Promise<unknown> };
  song: { details: (i: unknown) => Promise<unknown> };
  album: { details: (i: unknown) => Promise<unknown> };
  playlist: { details: (i: unknown) => Promise<unknown> };
  artist: { details: (i: unknown) => Promise<unknown> };
};

const MEDIA_URL = "https://aac.saavncdn.com/test/track_96.mp4";

let caller: Caller;
let encryptedMediaUrl: string;
/** Upstream `__call` value -> JSON body, set per test. */
let responses: Record<string, unknown> = {};
let calls: string[] = [];

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
    calls.push(call);
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

describe("router procedures", () => {
  it("home.home returns launch data with processed download URLs", async () => {
    calls = [];
    responses = {
      "webapi.getLaunchData": {
        new_trending: [song("s1")],
        top_playlists: [{ id: "p1", title: "Test Playlist" }],
      },
    };

    const result = (await caller.home.home({ lang: "hindi" })) as {
      new_trending: { id: string; title: string }[];
    };

    expect(calls).toEqual(["webapi.getLaunchData"]);
    expect(result.new_trending[0]?.id).toBe("s1");
    expect(result.new_trending[0]?.title).toBe("Test Song");
    expect(downloadUrlOf(result.new_trending[0])).toContain("_320.mp4");
  });

  it("song.details returns song payload matching SongObj shape", async () => {
    const id = uniq();
    calls = [];
    responses = { "song.getDetails": { songs: [song(id)] } };

    const result = (await caller.song.details({ id })) as {
      songs: { id: string; more_info: { album: string } }[];
    };

    expect(calls).toEqual(["song.getDetails"]);
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0]?.id).toBe(id);
    expect(result.songs[0]?.more_info.album).toBe("Test Album");
    expect(downloadUrlOf(result.songs[0])).toContain("_320.mp4");
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

    const result = (await caller.album.details({ id })) as {
      id: string;
      title: string;
      list: unknown[];
    };

    expect(calls).toEqual(["content.getAlbumDetails"]);
    expect(result.id).toBe(id);
    expect(result.title).toBe("Test Album");
    expect(Array.isArray(result.list)).toBe(true);
    expect(downloadUrlOf(result.list[0])).toContain("_320.mp4");
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

    const result = (await caller.playlist.details({ id })) as {
      id: string;
      title: string;
    };

    expect(calls).toEqual(["playlist.getDetails"]);
    expect(result.id).toBe(id);
    expect(result.title).toBe("Test Playlist");
    expect(downloadUrlOf((result as { list: unknown[] }).list[0])).toContain(
      "_320.mp4",
    );
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

    const result = (await caller.artist.details({ id })) as {
      artistId: string;
      name: string;
      topSongs: unknown[];
    };

    expect(calls).toEqual(["artist.getArtistPageDetails"]);
    expect(result.artistId).toBe(id);
    expect(result.name).toBe("Artist 1");
    expect(result.topSongs).toHaveLength(1);
    expect(downloadUrlOf(result.topSongs[0])).toContain("_320.mp4");
  });

  it("song.details supports token lookup via webapi.get", async () => {
    calls = [];
    responses = { "webapi.get": { songs: [song("s1")] } };

    const result = (await caller.song.details({ token: uniq() })) as {
      songs: { id: string }[];
    };

    expect(calls).toEqual(["webapi.get"]);
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0]?.id).toBe("s1");
    expect(downloadUrlOf(result.songs[0])).toContain("_320.mp4");
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

    const result = (await caller.artist.details({ token: uniq() })) as {
      artistId: string;
      name: string;
    };

    expect(calls).toEqual(["webapi.get"]);
    expect(result.artistId).toBe("ar1");
    expect(result.name).toBe("Artist 1");
    expect(
      downloadUrlOf((result as { topSongs: unknown[] }).topSongs[0]),
    ).toContain("_320.mp4");
  });
});
