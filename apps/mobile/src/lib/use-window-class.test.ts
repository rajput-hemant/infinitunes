import { renderHook } from "@testing-library/react-native";
import { Dimensions } from "react-native";

import { gridCardWidth, useGrid } from "./use-grid-card-width";
import { useWindowClass, windowClassOf } from "./use-window-class";

const initial = Dimensions.get("window");

function atWidth(width: number) {
  Dimensions.set({ window: { ...initial, width } });
}

afterEach(() => Dimensions.set({ window: initial }));

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
  [390, { picks: 2, cards: 3, tiles: 2 }],
  [700, { picks: 3, cards: 4, tiles: 2 }],
  [1024, { picks: 4, cards: 6, tiles: 4 }],
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
