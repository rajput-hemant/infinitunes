import { swipeCommits } from "./swipe-remove";

describe("swipeCommits", () => {
  const width = 390;

  it("rests open for a slow swipe that stops short", () => {
    expect(swipeCommits(-120, -200, width)).toBe(false);
    expect(swipeCommits(-200, 0, width)).toBe(false);
  });

  it("removes at once past 60% of the row, however slowly", () => {
    expect(swipeCommits(-0.61 * width, 0, width)).toBe(true);
    expect(swipeCommits(-0.59 * width, 0, width)).toBe(false);
  });

  it("removes at once for a fast leftward fling", () => {
    expect(swipeCommits(-90, -2000, width)).toBe(true);
  });

  it("ignores a fast flick that barely moved, a rightward fling and an unmeasured row", () => {
    expect(swipeCommits(-10, -3000, width)).toBe(false);
    expect(swipeCommits(90, 2000, width)).toBe(false);
    expect(swipeCommits(-300, -3000, 0)).toBe(false);
  });
});
