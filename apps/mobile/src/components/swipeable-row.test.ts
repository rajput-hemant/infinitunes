import { isWorkletFunction } from "react-native-worklets";

import { space } from "~/theme/tokens";

import {
  capsuleLayout,
  openWidth,
  FLING_MIN_DISTANCE,
  FLING_VELOCITY,
  FULL_SWIPE_SHARE,
  shouldCommitSwipe,
} from "./swipeable-row";

const GAP = space.sm;
const base = { velocity: 0, width: 400 };

describe("shouldCommitSwipe", () => {
  it("commits a slow drag only past the share of the row width", () => {
    const edge = FULL_SWIPE_SHARE * 400;
    expect(
      shouldCommitSwipe({ ...base, translation: edge + 1, side: "leading" }),
    ).toBe(true);
    expect(
      shouldCommitSwipe({ ...base, translation: edge, side: "leading" }),
    ).toBe(false);
    expect(
      shouldCommitSwipe({ ...base, translation: -edge - 1, side: "trailing" }),
    ).toBe(true);
    expect(
      shouldCommitSwipe({ ...base, translation: 80, side: "leading" }),
    ).toBe(false);
  });

  it("commits a fast fling toward the side once it has moved a little", () => {
    const fling = {
      width: 400,
      velocity: FLING_VELOCITY + 1,
      translation: FLING_MIN_DISTANCE + 1,
    };
    expect(shouldCommitSwipe({ ...fling, side: "leading" })).toBe(true);
    expect(
      shouldCommitSwipe({
        ...fling,
        translation: -fling.translation,
        velocity: -fling.velocity,
        side: "trailing",
      }),
    ).toBe(true);
    expect(
      shouldCommitSwipe({
        ...fling,
        translation: FLING_MIN_DISTANCE,
        side: "leading",
      }),
    ).toBe(false);
    expect(
      shouldCommitSwipe({
        ...fling,
        velocity: FLING_VELOCITY,
        side: "leading",
      }),
    ).toBe(false);
  });

  it("ignores a fling away from the side and an unmeasured row", () => {
    expect(
      shouldCommitSwipe({
        width: 400,
        translation: 100,
        velocity: -2000,
        side: "leading",
      }),
    ).toBe(false);
    expect(
      shouldCommitSwipe({
        width: 0,
        translation: 300,
        velocity: 2000,
        side: "leading",
      }),
    ).toBe(false);
  });
});

describe("capsuleLayout", () => {
  const open = openWidth(2);

  it("rests with the primary next to the row and the other outermost", () => {
    const primary = capsuleLayout(open, 0, 0, 2);
    const other = capsuleLayout(open, 0, 1, 2);
    // Distances from the screen edge: the primary is the one closer to the row.
    expect(primary.edge).toBeGreaterThan(other.edge);
    expect(primary.edge + primary.width + GAP).toBe(open);
    expect(other.edge).toBe(GAP);
    expect(other.opacity).toBe(1);
  });

  it("stretches the primary over the whole pane and fades the rest once past the commit point", () => {
    const reveal = 300;
    const primary = capsuleLayout(reveal, 1, 0, 2);
    expect(primary.edge).toBe(GAP);
    expect(primary.width).toBe(reveal - 2 * GAP);
    expect(capsuleLayout(reveal, 1, 1, 2).opacity).toBe(0);
  });

  it("lets the primary absorb an overshoot before the commit point", () => {
    const rest = capsuleLayout(open, 0, 0, 2);
    const pulled = capsuleLayout(open + 40, 0, 0, 2);
    expect(pulled.edge).toBe(rest.edge);
    expect(pulled.width).toBe(rest.width + 40);
  });
});

describe("UI-thread helpers", () => {
  // Called from useAnimatedStyle/useAnimatedReaction: a plain function there
  // throws "Tried to synchronously call a Remote Function" on device.
  it.each([
    ["capsuleLayout", capsuleLayout],
    ["openWidth", openWidth],
    ["shouldCommitSwipe", shouldCommitSwipe],
  ])("%s is a worklet", (_name, fn) => {
    expect(isWorkletFunction(fn)).toBe(true);
  });
});
