import type { ReactNode } from "react";
import { View } from "react-native";

import { CARD_COLUMNS, GRID_GAP } from "~/lib/use-grid-card-width";
import { sizes } from "~/theme/tokens";

// Logical edges: in RTL the gutter stays on the outside of each column.
const START = { paddingStart: sizes.page, paddingBottom: GRID_GAP };
const MIDDLE = { paddingBottom: GRID_GAP };
const END = { paddingEnd: sizes.page, paddingBottom: GRID_GAP };

/**
 * One cell of a full-width `CARD_COLUMNS` `FlashList` holding a
 * `useGridCardWidth(CARD_COLUMNS)` card: the first column sits on the page
 * gutter, the last on the opposite one and the middle one centred, so
 * `GRID_GAP` is what remains between them and the list needs no padding.
 */
export function GridCell({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const column = index % CARD_COLUMNS;
  const [align, style] =
    column === 0
      ? ["items-start", START]
      : column === CARD_COLUMNS - 1
        ? ["items-end", END]
        : ["items-center", MIDDLE];
  return (
    <View className={align} style={style}>
      {children}
    </View>
  );
}
