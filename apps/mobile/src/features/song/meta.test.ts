import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";

import { lyricsText } from "./lyrics-text";
import {
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

  it("sums the running time of the rows", () => {
    const rows = [rawSong({ id: "a" }), rawSong({ id: "b" })].map(toSongRow);
    expect(totalDurationLabel(rows)).toBe("03:30");
    expect(totalDurationLabel([])).toBe("");
  });
});

describe("lyricsText", () => {
  it("turns breaks into newlines, drops other markup and decodes entities", () => {
    expect(lyricsText("One<br>Two &amp; Three<br/><i>Four</i>")).toBe(
      "One\nTwo & Three\nFour",
    );
  });
});
