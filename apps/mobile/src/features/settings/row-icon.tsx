import { Icon } from "@expo/ui";
import type { ColorValue } from "react-native";

import { ROW_TINT } from "./tap-row-props";
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
  color = ROW_TINT.gray,
}: {
  name: SFSymbol;
  color?: ColorValue;
}) {
  return (
    <Icon
      name={name}
      size={ICON}
      // White in both schemes, as the Settings app's tiles.
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
