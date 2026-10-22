import { Icon } from "@expo/ui";

import type { SFSymbol } from "./tap-row-props";

const SIZE = 29;
const ICON = 16;

/**
 * A white SF Symbol on a 29pt tinted rounded square, like the system Settings app.
 * The symbol's own frame is the tile: SwiftUI centres an image in its frame,
 * where a stack of spacers left the glyph about 2pt low (its text baseline).
 */
export function RowIcon({
  name,
  color = "#8E8E93",
}: {
  name: SFSymbol;
  color?: string;
}) {
  return (
    <Icon
      name={name}
      size={ICON}
      color="#FFFFFF"
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: 7,
        backgroundColor: color,
      }}
    />
  );
}
