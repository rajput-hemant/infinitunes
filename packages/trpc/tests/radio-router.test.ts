import { beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { db } from "@infinitunes/db";

process.env.JIOSAAVN_DES_KEY ??= "38346591";

const MEDIA_URL = "https://aac.saavncdn.com/test/radio_track_96.mp4";

async function createTestCaller() {
  const { appRouter } = await import("../src/root");
  const { createCallerFactory } = await import("../src/trpc");
  return createCallerFactory(appRouter)({ db, session: null });
}

let caller: Awaited<ReturnType<typeof createTestCaller>>;
let encryptedMediaUrl: string;
let responses: Record<string, unknown> = {};
let calls: string[] = [];

let seq = 0;
const uniq = () => `radio-fixture-${++seq}`;

function mockSong(id: string, title = "Test Radio Track") {
  return {
    id,
    title,
    subtitle: "Test Subtitle",
    type: "song",
    perma_url: `https://www.jiosaavn.com/song/test/${id}`,
    image: "https://c.saavncdn.com/test/track_150x150.jpg",
    language: "hindi",
    year: "2024",
    more_info: {
      album: "Test Album",
      duration: "200",
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
    if (!(call in responses)) {
      throw new Error(
        `unexpected upstream call: ${call} with url: ${url.toString()}`,
      );
    }
    return new Response(JSON.stringify(responses[call]));
  };

  caller = await createTestCaller();
});

beforeEach(() => {
  calls = [];
  responses = {};
});

describe("radioRouter", () => {
  describe("createStation", () => {
    it("creates a featured station session", async () => {
      responses["webradio.createFeaturedStation"] = {
        stationid: "test-station-session-id-123",
      };

      const res = await caller.radio.createStation({
        type: "featured",
        name: "Retro Classics",
        language: uniq(),
      });

      expect(res.stationId).toBe("test-station-session-id-123");
      expect(calls).toContain("webradio.createFeaturedStation");
    });

    it("creates an artist station session with artistId", async () => {
      responses["webradio.createArtistStation"] = {
        stationid: "test-artist-station-id-456",
      };

      const res = await caller.radio.createStation({
        type: "artist",
        name: "Arijit Singh",
        artistId: "459320",
        language: uniq(),
      });

      expect(res.stationId).toBe("test-artist-station-id-456");
      expect(calls).toContain("webradio.createArtistStation");
    });

    it("never serves a cached station session to a second listener", async () => {
      const language = uniq();
      let n = 0;
      const upstream = globalThis.fetch;
      globalThis.fetch = async (input) => {
        const url = new URL(String(input));
        if (url.searchParams.get("__call") !== "webradio.createFeaturedStation")
          return upstream(input);
        return new Response(JSON.stringify({ stationid: `session-${++n}` }));
      };
      try {
        const input = { type: "featured", name: "Same", language } as const;
        const first = await caller.radio.createStation(input);
        const second = await caller.radio.createStation(input);
        expect(second.stationId).not.toBe(first.stationId);
      } finally {
        globalThis.fetch = upstream;
      }
    });

    it("falls back to featured station if artist station returns empty", async () => {
      responses["webradio.createArtistStation"] = [];
      responses["webradio.createFeaturedStation"] = {
        stationid: "fallback-station-id-789",
      };

      const res = await caller.radio.createStation({
        type: "artist",
        name: "Arijit Singh",
        artistId: "459320",
        language: uniq(),
      });

      expect(res.stationId).toBe("fallback-station-id-789");
    });

    it("throws NOT_FOUND when upstream returns no station ID", async () => {
      responses["webradio.createFeaturedStation"] = [];

      await expect(
        caller.radio.createStation({
          type: "featured",
          name: "Nonexistent Station",
          language: uniq(),
        }),
      ).rejects.toThrow("Failed to create radio station session");
    });
  });

  describe("songs", () => {
    it("extracts songs from keyed dictionary and attaches decrypted download_url", async () => {
      responses["webradio.getSong"] = {
        "0": { song: mockSong("s1", "Song 1") },
        "1": { song: mockSong("s2", "Song 2") },
        stationid: "test-station-id",
      };

      const songs = await caller.radio.songs({
        stationId: "test-station-id",
        k: 10,
        lang: uniq(),
      });

      expect(songs).toBeArray();
      expect(songs.length).toBe(2);
      expect(songs[0].id).toBe("s1");
      expect(songs[0].title).toBe("Song 1");
      expect(songs[0].download_url).toBeDefined();
      expect(typeof songs[0].download_url).toBe("string");
      expect(songs[1].id).toBe("s2");
    });

    it("handles next batch refill parameters", async () => {
      responses["webradio.getSong"] = {
        "0": { song: mockSong("s3", "Song 3") },
        stationid: "test-station-id",
      };

      const songs = await caller.radio.songs({
        stationId: "test-station-id",
        k: 5,
        next: 1,
        lang: uniq(),
      });

      expect(songs.length).toBe(1);
      expect(songs[0].id).toBe("s3");
    });

    it("never serves a repeated refill from the response cache", async () => {
      // webradio.getSong is randomized per call; a cached answer would hand
      // the player the same batch again and the station would run dry.
      const input = {
        stationId: "refill-station",
        k: 10,
        next: 1,
        lang: uniq(),
      };

      responses["webradio.getSong"] = { "0": { song: mockSong("r1") } };
      const first = await caller.radio.songs(input);

      responses["webradio.getSong"] = { "0": { song: mockSong("r2") } };
      const second = await caller.radio.songs(input);

      expect(first[0].id).toBe("r1");
      expect(second[0].id).toBe("r2");
    });
  });

  describe("stationDetails", () => {
    it("resolves existing station and loads initial songs", async () => {
      const mockStation = {
        id: "Retro-Classics",
        title: "Retro Classics",
        subtitle: "Hindi Radio",
        type: "radio_station",
        image: "https://c.saavncdn.com/editorial/retro.jpg",
        perma_url:
          "https://www.saavn.com/s/radio/hindi-featured-station/Retro-Classics",
        explicit_content: "0",
        more_info: {
          featured_station_type: "featured",
          language: "hindi",
          station_display_text: "Retro Classics",
          query: "",
        },
      };

      responses["webradio.getFeaturedStations"] = [mockStation];
      responses["webradio.createFeaturedStation"] = {
        stationid: "session-for-retro",
      };
      responses["webradio.getSong"] = {
        "0": { song: mockSong("r1", "Retro Song 1") },
        "1": { song: mockSong("r2", "Retro Song 2") },
        stationid: "session-for-retro",
      };

      const details = await caller.radio.stationDetails({
        token: "Retro-Classics",
        name: "hindi-featured-station",
        lang: uniq(),
      });

      expect(details.station).toBeDefined();
      expect(details.station.title).toBe("Retro Classics");
      expect(details.stationId).toBe("session-for-retro");
      expect(details.songs.length).toBe(2);
      expect(details.songs[0].title).toBe("Retro Song 1");
    });

    it("creates synthetic station when token is not in featured stations list", async () => {
      responses["webradio.getFeaturedStations"] = [];
      responses["webradio.createFeaturedStation"] = {
        stationid: "synthetic-session-id",
      };
      responses["webradio.getSong"] = {
        "0": { song: mockSong("s-syn", "Synthetic Song") },
        stationid: "synthetic-session-id",
      };

      const details = await caller.radio.stationDetails({
        token: "Custom-Mood-Station",
        lang: uniq(),
      });

      expect(details.station.title).toBe("Custom Mood Station");
      expect(details.stationId).toBe("synthetic-session-id");
      expect(details.songs.length).toBe(1);
    });
  });
});
