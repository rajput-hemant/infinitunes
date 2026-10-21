import type { ReactNode } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

/**
 * `~/components/ui/skeleton` for screens that render a loading state
 * (`jest.mock("~/components/ui/skeleton", () =>
 * require("~/features/browse/skeleton-mock"))`). The real pulse animates with
 * Reanimated, whose mock in the shared Jest setup does not load once a screen
 * imports it. Same accessibility contract, no animation.
 */
export function SkeletonPulse({ children }: { children: ReactNode }) {
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {children}
    </View>
  );
}

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={style} />;
}
