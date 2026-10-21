import type { ReactNode } from "react";
import { View } from "react-native";

/**
 * Test stand-in for `~/components/ui/skeleton`: the real pulse renders
 * Reanimated's `Animated.View`, which the shared Jest setup's Reanimated mock
 * does not provide. Same accessibility contract, plain Views.
 */
export function SkeletonPulse({ children }: { children: ReactNode }) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {children}
    </View>
  );
}

export function SkeletonBlock() {
  return <View />;
}
