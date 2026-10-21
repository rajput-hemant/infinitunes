/**
 * `~/components/ui/skeleton` for the detail screens' tests
 * (`jest.mock("~/components/ui/skeleton", () =>
 * require("~/features/song/skeleton-mock"))`). The real pulse animates with
 * Reanimated, whose Jest mock cannot load worklets' native module here;
 * these keep the same "Loading" progressbar semantics.
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

export function SkeletonBlock() {
  return <View />;
}
