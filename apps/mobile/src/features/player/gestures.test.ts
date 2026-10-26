import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { impactAsync } from "expo-haptics";

import { playerStore } from "~/playback/player-store";

import { changeSong, shouldDismiss, swipeDecision } from "./gestures";
import { scrubStep } from "./haptics";

const WIDTH = 400;
const HEIGHT = 800;

describe("swipeDecision", () => {
  it("changes the song past a third of the width, left for next", () => {
    expect(swipeDecision(-130, 0, WIDTH)).toBe("next");
    expect(swipeDecision(130, 0, WIDTH)).toBe("previous");
  });

  it("springs back from a short, slow drag", () => {
    expect(swipeDecision(-100, -200, WIDTH)).toBeNull();
    expect(swipeDecision(0, 0, WIDTH)).toBeNull();
  });

  it("takes a short flick the way it goes", () => {
    expect(swipeDecision(-40, -900, WIDTH)).toBe("next");
    expect(swipeDecision(40, 900, WIDTH)).toBe("previous");
  });

  it("keeps the song when a long drag is flicked back", () => {
    expect(swipeDecision(-200, 900, WIDTH)).toBeNull();
  });

  it("springs back past the queue's end, either way", () => {
    const last = { next: false, previous: true };
    expect(swipeDecision(-200, -900, WIDTH, last)).toBeNull();
    expect(swipeDecision(200, 0, WIDTH, last)).toBe("previous");
    const first = { next: true, previous: false };
    expect(swipeDecision(200, 900, WIDTH, first)).toBeNull();
  });
});

describe("changeSong", () => {
  const initial = playerStore.getState();
  beforeEach(() => {
    playerStore.setState(initial, true);
    playerStore.getState().playTracks(
      ["a", "b"].map((id) => toSongRow(rawSong({ id }))),
      {
        startIndex: 1,
      },
    );
    jest.mocked(impactAsync).mockClear();
  });

  it("does nothing, not even a tap, past the end of an unlooped queue", () => {
    changeSong("next");
    expect(playerStore.getState().currentIndex).toBe(1);
    expect(impactAsync).not.toHaveBeenCalled();

    changeSong("previous");
    expect(playerStore.getState().currentIndex).toBe(0);
    expect(impactAsync).toHaveBeenCalledTimes(1);
  });

  it("wraps when the queue repeats", () => {
    playerStore.setState({ repeat: "playlist" });
    changeSong("next");
    expect(playerStore.getState().currentIndex).toBe(0);
  });
});

describe("shouldDismiss", () => {
  it("closes past a fifth of the screen or on a flick down", () => {
    expect(shouldDismiss(170, 0, HEIGHT)).toBe(true);
    expect(shouldDismiss(40, 900, HEIGHT)).toBe(true);
  });

  it("stays for a short drag, or a drag that ends above where it began", () => {
    expect(shouldDismiss(150, 100, HEIGHT)).toBe(false);
    expect(shouldDismiss(0, 900, HEIGHT)).toBe(false);
  });
});

describe("scrubStep", () => {
  it("ticks once per twentieth of the track", () => {
    expect(scrubStep(9, 200)).toBe(0);
    expect(scrubStep(10, 200)).toBe(1);
    expect(scrubStep(199, 200)).toBe(19);
  });

  it("steps at least a second on a short or unknown track", () => {
    expect(scrubStep(3, 0)).toBe(3);
  });
});
