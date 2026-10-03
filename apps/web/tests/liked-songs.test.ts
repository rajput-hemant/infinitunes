import { describe, expect, it, spyOn } from "bun:test";

import type { Song } from "@infinitunes/types";

import { chunk, fetchSongsChunked } from "../lib/liked-songs";

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
