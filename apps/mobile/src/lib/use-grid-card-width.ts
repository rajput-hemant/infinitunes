import { PixelRatio, useWindowDimensions } from "react-native";

import { sizes, space } from "~/theme/tokens";

import { type WindowClass, useWindowClass } from "./use-window-class";

/**
 * Columns per grid and window class: home's quick picks, browse's tiles (three
 * at most, so its six categories leave no orphan row) and catalog card grids
 * (`GridCell`). A wider window gets more columns, never wider phone cards.
 */
export const GRID_COLUMNS = {
  picks: { compact: 2, medium: 3, expanded: 4 },
  browse: { compact: 2, medium: 3, expanded: 3 },
  cards: { compact: 3, medium: 4, expanded: 6 },
} as const satisfies Record<string, Record<WindowClass, number>>;

export type GridKind = keyof typeof GRID_COLUMNS;

/** The gap between grid columns and rows (`space.md`). */
export const GRID_GAP = space.md;

/**
 * Width of one column of `columns` across `width`: the page gutter outside,
 * `GRID_GAP` between. Rounded down to a device pixel, so a flex-wrap row of
 * them never sums past the row (Yoga's float32) and wraps its last tile early.
 */
export function gridCardWidth(width: number, columns: number): number {
  const ratio = PixelRatio.get();
  const exact = (width - 2 * sizes.page - GRID_GAP * (columns - 1)) / columns;
  // The epsilon keeps a whole pixel from flooring one below (518.99999...).
  return Math.floor(exact * ratio + 1e-6) / ratio;
}

/** Width of one column of `columns` across the window. */
export function useGridCardWidth(columns: number): number {
  return gridCardWidth(useWindowDimensions().width, columns);
}

/** A grid's column count for the current window and the width of one column. */
export function useGrid(kind: GridKind): { columns: number; width: number } {
  const columns = GRID_COLUMNS[kind][useWindowClass()];
  return { columns, width: useGridCardWidth(columns) };
}
