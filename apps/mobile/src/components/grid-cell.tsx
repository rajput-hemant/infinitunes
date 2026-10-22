import type { ReactNode } from "react";
import { View } from "react-native";

import { GRID_GAP } from "~/lib/use-grid-card-width";
import { sizes } from "~/theme/tokens";

// Logical edges: in RTL the gutter stays on the outside of each column.
const START = { paddingStart: sizes.page, paddingBottom: GRID_GAP };
const END = { paddingEnd: sizes.page, paddingBottom: GRID_GAP };

/**
 * One cell of a full-width `FlashList` of `useGrid("cards")` columns holding
 * a card of the grid's width: the first column sits on the page gutter, the
 * last on the opposite one, and each inner one is inset from its cell's start
 * by what keeps `GRID_GAP` between every pair (centred, with three columns),
 * so the list needs no padding.
 */
export function GridCell({
  index,
  columns,
  children,
}: {
  index: number;
  columns: number;
  children: ReactNode;
}) {
  const column = index % columns;
  const [align, style] =
    column === 0
      ? ["items-start", START]
      : column === columns - 1
        ? ["items-end", END]
        : [
            "items-start",
            {
              paddingStart:
                sizes.page - (column * (2 * sizes.page - GRID_GAP)) / columns,
              paddingBottom: GRID_GAP,
            },
          ];
  return (
    <View className={align} style={style}>
      {children}
    </View>
  );
}
