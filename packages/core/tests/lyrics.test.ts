import { describe, expect, it } from "bun:test";

import { activeLineIndex, parseLrc } from "../src/lyrics";

describe("LRC", () => {
  it("preserves bracketed lyric text", () => {
    expect(parseLrc("[00:01]Sing [with me]")).toEqual([
      { time: 1, text: "Sing [with me]" },
    ]);
  });
  it("expands repeated timestamps, sorts, skips metadata and retains timed gaps", () => {
    expect(
      parseLrc(
        "[ar:Singer]\n[01:02.123][00:02.50] Repeat\n\n[00:03.000]\n[99:99]bad\nuntimed\n[offset:-500]",
      ),
    ).toEqual([
      { time: 3, text: "Repeat" },
      { time: 3.5, text: "" },
      { time: 62.623, text: "Repeat" },
    ]);
  });
  it("supports positive offsets, clamps negative timestamps and ignores malformed input", () => {
    expect(parseLrc("[offset:1000]\n[00:02.1]Hi")[0]).toEqual({
      time: 1.1,
      text: "Hi",
    });
    expect(parseLrc("[offset:-2000]\n[00:01]Hi")[0]?.time).toBe(3);
    expect(parseLrc("[offset:2000]\n[00:01]Hi")[0]?.time).toBe(0);
    expect(parseLrc("[ti:Song]\n[bad]")).toEqual([]);
  });
  it("follows boundaries, gaps, duplicates, backwards seeks and the final line", () => {
    const lines = parseLrc("[00:01]One\n[00:02]Two\n[00:02]Last");
    expect(
      [0, 1, 1.9, 2, 999, 1].map((p) => activeLineIndex(lines, p)),
    ).toEqual([-1, 0, 0, 2, 2, 0]);
    expect(activeLineIndex([], 10)).toBe(-1);
    expect(activeLineIndex(lines, NaN)).toBe(-1);
  });
});
