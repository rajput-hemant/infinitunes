import { describe, expect, test } from "bun:test";

import { isScrolled } from "~/lib/glass/scroll-edge";
import {
  DRAG_START_PX,
  dragBounds,
  nearestItem,
  releaseVelocity,
} from "~/lib/glass/selector";
import { INITIAL_TAB_MIN, nextTabMin } from "~/lib/glass/tab-min";
import type { TabMinState } from "~/lib/glass/tab-min";

const AT_100: TabMinState = { lastY: 100, acc: 0, minimized: false };

function scrollTo(
  ys: number[],
  wide = false,
  from: TabMinState = INITIAL_TAB_MIN,
) {
  return ys.reduce((state, y) => nextTabMin(state, y, wide), from);
}

/** Scrolled down 60px from y 100: minimized. */
const minimized = () => scrollTo([120, 140, 160], false, AT_100);

describe("nextTabMin", () => {
  test("minimizes after 48px of accumulated downward scroll past y 40", () => {
    expect(scrollTo([120, 140], false, AT_100).minimized).toBe(false);
    expect(minimized().minimized).toBe(true);
  });

  test("stays expanded while still in the top zone", () => {
    expect(scrollTo([10, 20, 30, 39]).minimized).toBe(false);
  });

  test("expands after 24px up", () => {
    const down = minimized();
    expect(nextTabMin(down, 152, false).minimized).toBe(true);
    expect(nextTabMin(down, 130, false).minimized).toBe(false);
  });

  test("a direction change restarts the accumulator", () => {
    expect(scrollTo([120, 130, 125, 135], false, AT_100).minimized).toBe(false);
  });

  test("expands back at the top of the page", () => {
    expect(nextTabMin(minimized(), 20, false).minimized).toBe(false);
  });

  test("never minimizes on a wide viewport", () => {
    expect(scrollTo([120, 160, 300], true, AT_100).minimized).toBe(false);
  });
});

describe("isScrolled", () => {
  test("flips just past the threshold", () => {
    expect(isScrolled(4)).toBe(false);
    expect(isScrolled(5)).toBe(true);
    expect(isScrolled(10, 20)).toBe(false);
  });
});

describe("selector drag math", () => {
  const items = [
    { left: 0, width: 80 },
    { left: 80, width: 80 },
    { left: 160, width: 80 },
  ];

  test("the indicator stays within the first and last item", () => {
    expect(dragBounds(items, 80)).toEqual({ min: 0, max: 160 });
  });

  test("snaps to the item nearest the projected position", () => {
    expect(nearestItem(items, 30)).toBe(0);
    expect(nearestItem(items, 130)).toBe(1);
    expect(nearestItem(items, 400)).toBe(2);
  });

  test("release velocity comes from the first and last samples", () => {
    expect(
      releaseVelocity([
        [0, 0],
        [30, 50],
        [100, 100],
      ]),
    ).toBeCloseTo(1000);
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([[5, 10]])).toBe(0);
  });

  test("a drag starts at 8px", () => {
    expect(DRAG_START_PX).toBe(8);
  });
});
