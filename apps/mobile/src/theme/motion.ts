import type { WithSpringConfig } from "react-native-reanimated";

/**
 * Material 3 Expressive's springs (Compose `MotionScheme.expressive()`) for
 * Reanimated's `withSpring`, mass 1: `damping` is the coefficient
 * 2·ζ·√stiffness, not Compose's ratio ζ. Spatial springs move things and may
 * overshoot; effects springs (colour, opacity) never do. Worklet springs
 * follow the system's reduce motion setting (`ReduceMotion.System`).
 */
export const springs = {
  /** Stiffness 800, ζ 0.6: press feedback, small shape morphs. */
  spatialFast: { stiffness: 800, damping: 34 },
  /** Stiffness 380, ζ 0.8: a control changing shape or place. */
  spatialDefault: { stiffness: 380, damping: 31 },
  /** Stiffness 200, ζ 0.8: large surfaces. */
  spatialSlow: { stiffness: 200, damping: 23 },
  /** Stiffness 1600, ζ 1: colour and opacity. */
  effectsDefault: { stiffness: 1600, damping: 80 },
} as const satisfies Record<string, WithSpringConfig>;
