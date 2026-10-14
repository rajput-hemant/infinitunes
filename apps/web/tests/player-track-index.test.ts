import { describe, expect, it } from "bun:test";

import {
  loopModeOf,
  nextTrackIndex,
  prevTrackIndex,
} from "../components/player/track-index";

const order = (
  currentIndex: number,
  overrides: {
    length?: number;
    shuffle?: boolean;
    loopPlaylist?: boolean;
  } = {},
) => ({
  length: 3,
  shuffle: false,
  loopPlaylist: false,
  ...overrides,
  currentIndex,
});

describe("nextTrackIndex", () => {
  it("skips forward in order", () => {
    expect(nextTrackIndex(order(0), { reason: "skip" })).toBe(1);
  });

  it("stays on the last track unless the playlist loops", () => {
    expect(nextTrackIndex(order(2), { reason: "skip" })).toBe(2);
    expect(
      nextTrackIndex(order(2, { loopPlaylist: true }), { reason: "skip" }),
    ).toBe(0);
  });

  it("advances when the track ends", () => {
    expect(
      nextTrackIndex(order(0), { reason: "ended", repeatOne: false }),
    ).toBe(1);
  });

  it("repeats the same track on end when repeat-one is on", () => {
    expect(nextTrackIndex(order(1), { reason: "ended", repeatOne: true })).toBe(
      1,
    );
  });

  it("still skips past a repeating track when the user presses Next", () => {
    expect(nextTrackIndex(order(1), { reason: "skip" })).toBe(2);
  });

  it("never picks the current track when shuffling a longer queue", () => {
    for (let i = 0; i < 50; i++) {
      const next = nextTrackIndex(order(1, { shuffle: true }), {
        reason: "skip",
      });
      expect(next).not.toBe(1);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(3);
    }
  });

  it("keeps the track when shuffle ends with repeat-one on", () => {
    expect(
      nextTrackIndex(order(1, { shuffle: true }), {
        reason: "ended",
        repeatOne: true,
      }),
    ).toBe(1);
  });
});

describe("prevTrackIndex", () => {
  it("steps back and holds at the first track", () => {
    expect(prevTrackIndex(order(2))).toBe(1);
    expect(prevTrackIndex(order(0))).toBe(0);
  });

  it("wraps to the last track when the playlist loops", () => {
    expect(prevTrackIndex(order(0, { loopPlaylist: true }))).toBe(2);
  });
});

describe("loopModeOf", () => {
  it("maps the player's loop flags to the control's three states", () => {
    expect(loopModeOf(false, false)).toBe("off");
    expect(loopModeOf(false, true)).toBe("playlist");
    expect(loopModeOf(true, false)).toBe("track");
    expect(loopModeOf(true, true)).toBe("track");
  });
});
