import type { ReactNode } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { cx } from "~/lib/class-names";

/** `[0, 1, ..., count - 1]`: the keys of a skeleton's repeated blocks. */
export const range = (count: number) =>
  Array.from({ length: count }, (_, i) => i);

const PULSE = {
  from: { opacity: 1 },
  to: { opacity: 0.45 },
};

/**
 * One slow pulse for a whole loading layout, so its blocks breathe together
 * (and run one animation, not one per block). Reanimated drops it under the
 * system's reduce-motion setting; the blocks stay as a static placeholder.
 */
export function SkeletonPulse({ children }: { children: ReactNode }) {
  return (
    <Animated.View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={{
        animationName: PULSE,
        animationDuration: "900ms",
        animationDirection: "alternate",
        animationIterationCount: "infinite",
        animationTimingFunction: "ease-in-out",
      }}
    >
      {children}
    </Animated.View>
  );
}

type SkeletonBlockProps = {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/** A placeholder shape in the fill colour; size and radius come from the caller. */
export function SkeletonBlock({ className, style }: SkeletonBlockProps) {
  return <View className={cx("bg-fill-2", className)} style={style} />;
}
