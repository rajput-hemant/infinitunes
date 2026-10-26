import {
  FLING_MIN_DISTANCE,
  FLING_VELOCITY,
  FULL_SWIPE_SHARE,
  shouldCommitSwipe,
} from "./swipeable-row";

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
