import { afterEach, beforeAll, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

const originalFetch = globalThis.fetch;
let caller: Awaited<ReturnType<typeof createCaller>>;
let calls: URL[] = [];
let userAgents: (string | null)[] = [];
let get: unknown;
let search: unknown;
let fallback: unknown;
let title = "Song &amp; title";
let seq = 0;

async function createCaller() {
  const { songRouter } = await import("../src/router/song");
  return songRouter.createCaller({ db, session: null });
}
beforeAll(async () => {
  caller = await createCaller();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function setup() {
  calls = [];
  userAgents = [];
  get = null;
  search = [];
  fallback = {};
  title = "Song &amp; title";
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    calls.push(url);
    userAgents.push(new Headers(init?.headers).get("User-Agent"));
    if (url.hostname === "lrclib.net") {
      const body = url.pathname.endsWith("/get") ? get : search;
      return Response.json(body, { status: body === null ? 404 : 200 });
    }
    if (url.searchParams.get("__call") === "lyrics.getLyrics")
      return Response.json(fallback);
    return Response.json({
      songs: [
        {
          title,
          subtitle: "Subtitle",
          more_info: {
            album: "Album",
            duration: "262",
            artistMap: { primary_artists: [{ name: "Singer &amp; Friend" }] },
          },
        },
      ],
    });
  };
  return { id: `lyrics-${++seq}` };
}

it("matches decoded metadata and parses synced lyrics with a descriptive User-Agent", async () => {
  const input = setup();
  get = {
    syncedLyrics: "[00:01.20]First",
    plainLyrics: "First",
    instrumental: false,
  };
  expect(await caller.syncedLyrics(input)).toMatchObject({
    source: "lrclib",
    synced: [{ time: 1.2, text: "First" }],
    plain: "First",
  });
  const url = calls.find((item) => item.hostname === "lrclib.net");
  expect(url?.searchParams.get("track_name")).toBe("Song & title");
  expect(url?.searchParams.get("artist_name")).toBe("Singer & Friend");
  expect(url?.searchParams.get("duration")).toBe("262");
  expect(userAgents).toContain(
    "Infinitunes (https://github.com/rajput-hemant/infinitunes)",
  );
});
it("searches after 404, rejects duration mismatches and prefers synced within three seconds", async () => {
  const input = setup();
  search = [
    { duration: 270, syncedLyrics: "[00:01]Wrong" },
    { duration: 262, plainLyrics: "Plain" },
    { duration: 265, syncedLyrics: "[00:02]Right" },
    { duration: "262", syncedLyrics: "[00:02]Malformed" },
  ];
  expect((await caller.syncedLyrics(input)).synced).toEqual([
    { time: 2, text: "Right" },
  ]);
});
it("retries a title without From and feat suffixes", async () => {
  const input = setup();
  title = 'Song (From "Film") (feat. Singer)';
  await caller.syncedLyrics(input);
  expect(
    calls
      .filter((url) => url.pathname === "/api/get")
      .map((url) => url.searchParams.get("track_name")),
  ).toEqual([title, "Song"]);
});
it("falls back to decoded JioSaavn plain lyrics and retains credit", async () => {
  const input = setup();
  fallback = { lyrics: "One<br>Two &amp; Three", lyrics_copyright: "Provider" };
  expect(await caller.syncedLyrics(input)).toEqual({
    synced: null,
    plain: "One\nTwo & Three",
    instrumental: false,
    source: "jiosaavn",
    copyright: "Provider",
  });
});
it("returns nulls for missing or malformed lyrics", async () => {
  const input = setup();
  get = { syncedLyrics: 10 };
  search = {};
  expect(await caller.syncedLyrics(input)).toMatchObject({
    synced: null,
    plain: null,
    instrumental: false,
  });
});
it("returns instrumental without falling back", async () => {
  const input = setup();
  get = { instrumental: true, plainLyrics: null, syncedLyrics: null };
  expect(await caller.syncedLyrics(input)).toMatchObject({
    instrumental: true,
    source: "lrclib",
    synced: null,
    plain: null,
  });
  expect(
    calls.some((url) => url.searchParams.get("__call") === "lyrics.getLyrics"),
  ).toBe(false);
});
