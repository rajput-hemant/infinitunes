import { useTheme } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

type IconProps = {
  /** An SF Symbol for iOS and a Material Symbol for Android. */
  name: SymbolViewProps["name"];
  size?: number;
  /** Defaults to the text colour. */
  color?: ColorValue;
};

/** A native platform symbol: SF Symbols on iOS, Material Symbols on Android. */
export function Icon({ name, size = 22, color }: IconProps) {
  const { colors } = useTheme();
  return (
    <SymbolView name={name} size={size} tintColor={color ?? colors.text} />
  );
}
