import { useWindowDimensions } from "react-native";

import { sizes, space } from "~/theme/tokens";

export const GRID_COLUMNS = 2;
/** The gap between grid columns and rows (`space.md`). */
export const GRID_GAP = space.md;

/** Width of a card in the two-column grid: the page gutter outside, `GRID_GAP` between columns. */
export function useGridCardWidth(): number {
  const { width } = useWindowDimensions();
  return (
    (width - 2 * sizes.page - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  );
}
