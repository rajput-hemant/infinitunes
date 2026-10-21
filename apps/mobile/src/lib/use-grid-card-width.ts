import { useWindowDimensions } from "react-native";

import { sizes } from "~/theme/tokens";

export const GRID_COLUMNS = 2;
export const GRID_GAP = 12;

/** Width of a card in the two-column grid: the page gutter outside, `GRID_GAP` between columns. */
export function useGridCardWidth(): number {
  const { width } = useWindowDimensions();
  return (
    (width - 2 * sizes.page - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  );
}
