import { describe, expect, it } from "bun:test";

import { playAllToastTitle } from "../components/library/play-all-button";

describe("playAllToastTitle (PQ-10)", () => {
  it("uses singular track wording for one item", () => {
    expect(playAllToastTitle(1)).toBe("1 track added to the queue");
  });

  it("uses neutral plural wording for mixed songs and episodes", () => {
    const title = playAllToastTitle(2);
    expect(title).toBe("2 tracks added to the queue");
    expect(title).not.toContain("song");
    expect(title).not.toContain("episode");
  });
});
