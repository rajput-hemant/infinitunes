import { useWindowDimensions } from "react-native";

import { sizes, space } from "~/theme/tokens";

import { type WindowClass, windowClassOf } from "./use-window-class";

/**
 * Columns per grid and window class: home's quick picks and browse's tiles,
 * catalog card grids (`GridCell`) and the Library tab's tiles. A wider window
 * gets more columns, never wider phone cards.
 */
export const GRID_COLUMNS = {
  picks: { compact: 2, medium: 3, expanded: 4 },
  cards: { compact: 3, medium: 4, expanded: 6 },
  tiles: { compact: 2, medium: 2, expanded: 4 },
} as const satisfies Record<string, Record<WindowClass, number>>;

export type GridKind = keyof typeof GRID_COLUMNS;

/** The gap between grid columns and rows (`space.md`). */
export const GRID_GAP = space.md;

/** Width of one column of `columns` across `width`: the page gutter outside, `GRID_GAP` between. */
export function gridCardWidth(width: number, columns: number): number {
  return (width - 2 * sizes.page - GRID_GAP * (columns - 1)) / columns;
}

/** Width of one column of `columns` across the window. */
export function useGridCardWidth(columns: number): number {
  return gridCardWidth(useWindowDimensions().width, columns);
}

/** A grid's column count for the current window and the width of one column. */
export function useGrid(kind: GridKind): { columns: number; width: number } {
  const { width } = useWindowDimensions();
  const columns = GRID_COLUMNS[kind][windowClassOf(width)];
  return { columns, width: gridCardWidth(width, columns) };
}
