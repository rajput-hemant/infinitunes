/**
 * `~/components/ui/skeleton` for Jest: the real pulse is a Reanimated
 * `Animated.View`, which the Reanimated mock (`default` without `View`)
 * leaves undefined. Use as `jest.mock("~/components/ui/skeleton", () =>
 * require("~/features/artist/test-skeleton"))`.
 */
import type { ReactNode } from "react";
import { View } from "react-native";

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

export const SkeletonBlock = View;
