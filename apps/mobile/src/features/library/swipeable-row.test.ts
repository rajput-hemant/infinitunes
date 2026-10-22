import { FULL_SWIPE_SHARE, isFullSwipe } from "./swipeable-row";

describe("isFullSwipe", () => {
  it("commits only past the share of the row width", () => {
    expect(isFullSwipe(-FULL_SWIPE_SHARE * 400 - 1, 400)).toBe(true);
    expect(isFullSwipe(-FULL_SWIPE_SHARE * 400, 400)).toBe(false);
    expect(isFullSwipe(-80, 400)).toBe(false);
  });

  it("never commits a rightward drag or an unmeasured row", () => {
    expect(isFullSwipe(300, 400)).toBe(false);
    expect(isFullSwipe(-300, 0)).toBe(false);
  });
});
