import type { ReactNode } from "react";
import { View } from "react-native";

import { GRID_GAP } from "~/lib/use-grid-card-width";
import { sizes } from "~/theme/tokens";

// Logical edges: in RTL the gutter stays on the outside of each column.
const START = { paddingStart: sizes.page, paddingBottom: GRID_GAP };
const END = { paddingEnd: sizes.page, paddingBottom: GRID_GAP };

/**
 * One cell of a full-width two-column `FlashList` (`numColumns={2}`) holding a
 * `useGridCardWidth()` card: the start column sits on the page gutter, the end
 * column on the opposite one, so `GRID_GAP` is what remains between them and
 * the list needs no padding of its own (no half gaps).
 */
export function GridCell({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const start = index % 2 === 0;
  return (
    <View
      className={start ? "items-start" : "items-end"}
      style={start ? START : END}
    >
      {children}
    </View>
  );
}
