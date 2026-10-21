import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";

import {
  durationInWords,
  joinMeta,
  playsLabel,
  songCountLabel,
  totalDurationLabel,
} from "./meta";

describe("meta line", () => {
  it("joins only the parts that exist", () => {
    expect(joinMeta(["Sachin-Jigar", "", undefined, "4 Songs"])).toBe(
      "Sachin-Jigar · 4 Songs",
    );
  });

  it("labels plays only when there are some", () => {
    expect(playsLabel("1200")).toBe("1.2K Plays");
    expect(playsLabel("")).toBe("");
    expect(playsLabel(0)).toBe("");
  });

  it("pluralises the song count", () => {
    expect(songCountLabel(1)).toBe("1 Song");
    expect(songCountLabel(3)).toBe("3 Songs");
  });

  it("sums the running time of the rows, in words", () => {
    const rows = [rawSong({ id: "a" }), rawSong({ id: "b" })].map(toSongRow);
    // 105s each: 3.5 minutes rounds to 4.
    expect(totalDurationLabel(rows)).toBe("4 min");
    expect(totalDurationLabel([])).toBe("");
  });

  it("reads a running time in hours and minutes", () => {
    expect(durationInWords(38 * 60 + 10)).toBe("38 min");
    expect(durationInWords(72 * 60)).toBe("1 hr 12 min");
    expect(durationInWords(2 * 3600 + 20)).toBe("2 hr");
    expect(durationInWords(59 * 60 + 45)).toBe("1 hr");
    expect(durationInWords(20)).toBe("1 min");
    expect(durationInWords(0)).toBe("");
  });
});
