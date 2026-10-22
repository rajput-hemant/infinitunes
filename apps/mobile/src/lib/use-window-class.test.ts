import { renderHook } from "@testing-library/react-native";
import { Dimensions, PixelRatio } from "react-native";

import { sizes } from "~/theme/tokens";

import { GRID_GAP, gridCardWidth, useGrid } from "./use-grid-card-width";
import { useWindowClass, windowClassOf } from "./use-window-class";

const initial = Dimensions.get("window");

function atWidth(width: number) {
  Dimensions.set({ window: { ...initial, width } });
}

afterEach(() => {
  Dimensions.set({ window: initial });
  jest.restoreAllMocks();
});

test("window classes break at 600 and 840", () => {
  expect(windowClassOf(390)).toBe("compact");
  expect(windowClassOf(599)).toBe("compact");
  expect(windowClassOf(600)).toBe("medium");
  expect(windowClassOf(839)).toBe("medium");
  expect(windowClassOf(840)).toBe("expanded");
  expect(windowClassOf(1366)).toBe("expanded");
});

test("useWindowClass follows the window width", async () => {
  atWidth(700);
  const { result } = await renderHook(() => useWindowClass());
  expect(result.current).toBe("medium");
});

test.each([
  [390, { picks: 2, browse: 2, cards: 3 }],
  [700, { picks: 3, browse: 3, cards: 4 }],
  [1024, { picks: 4, browse: 3, cards: 6 }],
])("at %ipt the grids have %o columns", async (width, expected) => {
  atWidth(width);
  for (const [kind, columns] of Object.entries(expected)) {
    const { result } = await renderHook(() =>
      useGrid(kind as keyof typeof expected),
    );
    const grid = result.current;
    expect(grid.columns).toBe(columns);
    expect(grid.width).toBe(gridCardWidth(width, columns));
  }
});

test.each([2.625, 3, 2])(
  "columns are whole device pixels that fit their row (ratio %f)",
  (ratio) => {
    jest.spyOn(PixelRatio, "get").mockReturnValue(ratio);
    for (let width = 600; width <= 1100; width++) {
      for (const columns of [3, 4, 6]) {
        const card = gridCardWidth(width, columns);
        // Whole pixels; an exact width keeps its value.
        expect(Number.isInteger(Math.round(card * ratio * 1e6) / 1e6)).toBe(
          true,
        );
        // Float32, as Yoga sums them.
        const row = Math.fround(
          columns * Math.fround(card) + (columns - 1) * GRID_GAP,
        );
        expect(row).toBeLessThanOrEqual(width - 2 * sizes.page);
      }
    }
    // At a whole ratio a width that divides evenly is not shaved.
    if (Number.isInteger(ratio)) {
      expect(gridCardWidth(390, 2)).toBe((390 - 32 - 12) / 2);
    }
  },
);
