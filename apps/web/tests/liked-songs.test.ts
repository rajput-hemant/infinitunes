import { describe, expect, it, spyOn } from "bun:test";

import type { Episode, Song } from "@infinitunes/types";

import { chunk, fetchSongsChunked, orderByIds } from "../lib/liked-songs";

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
