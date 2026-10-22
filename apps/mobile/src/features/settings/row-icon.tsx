import type { ColorValue } from "react-native";

import type { SFSymbol } from "./tap-row-props";

/** Leading row icons are an iOS Settings convention; Material rows stay plain. */
export function RowIcon(_props: { name: SFSymbol; color?: ColorValue }) {
  return null;
}
