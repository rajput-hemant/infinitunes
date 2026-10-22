import { useWindowDimensions } from "react-native";

import { sizes, space } from "~/theme/tokens";

/** Columns of home's quick-pick tiles and browse's tiles. */
export const GRID_COLUMNS = 2;
/** Columns of a catalog card grid (`GridCell`): compact, like a library grid. */
export const CARD_COLUMNS = 3;
/** The gap between grid columns and rows (`space.md`). */
export const GRID_GAP = space.md;

/** Width of one grid column: the page gutter outside, `GRID_GAP` between columns. */
export function useGridCardWidth(columns: number = GRID_COLUMNS): number {
  const { width } = useWindowDimensions();
  return (width - 2 * sizes.page - GRID_GAP * (columns - 1)) / columns;
}
