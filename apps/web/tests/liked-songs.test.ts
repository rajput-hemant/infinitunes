import { describe, expect, it, spyOn } from "bun:test";

import type { Episode, Song } from "@infinitunes/types";

import {
  chunk,
  fetchLikedSongsNewestFirst,
  fetchSongsChunked,
  orderByIds,
} from "../lib/liked-songs";

const song = (id: string) => ({ id }) as Song;

describe("chunk", () => {
  it("splits into sized groups", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

describe("fetchSongsChunked", () => {
  it("keeps partial results and logs failures", async () => {
    const err = spyOn(console, "error").mockImplementation(() => {});
    const details = async ({ id }: { id: string }) => {
      if (id.startsWith("c")) throw new Error("boom");
      return { songs: id.split(",").map(song) };
    };
    const songs = await fetchSongsChunked(["a", "b", "c", "d"], details, 2);
    expect(songs?.map((s) => s.id)).toEqual(["a", "b"]);
    expect(err).toHaveBeenCalledTimes(1);
    err.mockRestore();
  });

  it("recovers the other 24 ids when one id poisons a full chunk", async () => {
    const err = spyOn(console, "error").mockImplementation(() => {});
    try {
      const ids = Array.from({ length: 25 }, (_, i) => `id-${i}`);
      const calls: string[] = [];
      const details = async ({ id }: { id: string }) => {
        calls.push(id);
        if (id.split(",").includes("id-12"))
          throw Object.assign(new Error("Song not found"), {
            code: "NOT_FOUND",
          });
        return { songs: id.split(",").map(song) };
      };
      const result = await fetchSongsChunked(ids, details);
      expect(result?.map((item) => item.id)).toEqual(
        ids.filter((id) => id !== "id-12"),
      );
      expect(calls).toEqual([ids.join(","), ...ids]);
    } finally {
      err.mockRestore();
    }
  });

  it("does not amplify upstream outages into per-id requests", async () => {
    const err = spyOn(console, "error").mockImplementation(() => {});
    try {
      for (const code of ["BAD_GATEWAY", "TIMEOUT"]) {
        const calls: string[] = [];
        const result = await fetchSongsChunked(["a", "b"], async ({ id }) => {
          calls.push(id);
          throw Object.assign(new Error("Unavailable"), { code });
        });
        expect(result).toBeUndefined();
        expect(calls).toEqual(["a,b"]);
      }
    } finally {
      err.mockRestore();
    }
  });

  it("returns undefined when every chunk fails", async () => {
    const err = spyOn(console, "error").mockImplementation(() => {});
    const songs = await fetchSongsChunked(["a"], async () => {
      throw new Error("boom");
    });
    expect(songs).toBeUndefined();
    err.mockRestore();
  });
});

describe("recently played mixed lists", () => {
  it("resolves songs and episodes together and keeps history order", async () => {
    const episode = (id: string) => ({ id, type: "episode" }) as Episode;
    const details = async ({ id }: { id: string }) => ({
      // upstream answers in its own order and drops unknown ids
      songs: id
        .split(",")
        .filter((i) => i !== "gone")
        .reverse()
        .map((i) => (i.startsWith("EV") ? episode(i) : song(i))),
    });
    const ids = ["EV1", "s1", "gone", "EV2"];
    const fetched = await fetchSongsChunked(ids, details);

    expect(orderByIds(ids, fetched ?? []).map((i) => i.id)).toEqual([
      "EV1",
      "s1",
      "EV2",
    ]);
  });
});

describe("fetchLikedSongsNewestFirst", () => {
  it("returns the newest like first from an insertion-ordered list", async () => {
    // addToFavorites appends, so the stored list is oldest-first.
    const stored = ["first", "second", "third", "fourth", "fifth"];
    // Upstream answers each chunk in scrambled order.
    const details = async ({ id }: { id: string }) => ({
      songs: id.split(",").reverse().map(song),
    });

    const songs = await fetchLikedSongsNewestFirst(stored, details, 2);

    expect(songs?.map((s) => s.id)).toEqual([
      "fifth",
      "fourth",
      "third",
      "second",
      "first",
    ]);
    expect(stored[0]).toBe("first");
  });

  it("returns undefined when every chunk fails", async () => {
    const err = spyOn(console, "error").mockImplementation(() => {});
    const songs = await fetchLikedSongsNewestFirst(["a"], async () => {
      throw new Error("boom");
    });
    expect(songs).toBeUndefined();
    err.mockRestore();
  });
});
