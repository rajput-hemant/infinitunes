import { useTheme } from "expo-router";
import { View } from "react-native";
import type { ViewProps } from "react-native";

/**
 * A floating control's background: an elevated Material 3 surface container
 * (Android has no glass material).
 */
export function GlassSurface({ style, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[{ backgroundColor: colors.card, elevation: 3 }, style]}
      {...props}
    />
  );
}
