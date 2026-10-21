import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

import { iconSize } from "~/theme/tokens";
import type { IconSize } from "~/theme/tokens";

export type SymbolName = SymbolViewProps["name"];

type IconProps = {
  /** An SF Symbol for iOS and a Material Symbol for Android. */
  name: SymbolName;
  /** `lg` (24, header and toolbar buttons) by default; `md` (20) for row controls. */
  size?: IconSize;
  /** Defaults to the text colour. */
  color?: ColorValue;
};

/** A native platform symbol: SF Symbols on iOS, Material Symbols on Android. */
export function Icon({ name, size = "lg", color }: IconProps) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={name}
      size={iconSize[size]}
      tintColor={color ?? colors.text}
    />
  );
}
