import type { ReactNode } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { cx } from "~/lib/class-names";

/** `[0, 1, ..., count - 1]`: the keys of a skeleton's repeated blocks. */
export const range = (count: number) =>
  Array.from({ length: count }, (_, i) => i);

const PULSE = {
  from: { opacity: 1 },
  to: { opacity: 0.45 },
};

const PULSE_STYLE = {
  animationName: PULSE,
  animationDuration: "900ms",
  animationDirection: "alternate",
  animationIterationCount: "infinite",
  animationTimingFunction: "ease-in-out",
} as const;

/** The pulse's animation, or none while the system asks for reduced motion. */
export function pulseStyleFor(reduceMotion: boolean) {
  return reduceMotion ? undefined : PULSE_STYLE;
}

/**
 * One slow pulse for a whole loading layout, so its blocks breathe together
 * (and run one animation, not one per block). Reanimated's CSS animations
 * ignore the system's reduce-motion setting, so the pulse is dropped here and
 * the blocks stay as a static placeholder.
 */
export function SkeletonPulse({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={pulseStyleFor(reduceMotion)}
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
