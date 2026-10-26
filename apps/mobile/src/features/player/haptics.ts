import {
  AndroidHaptics,
  impactAsync,
  ImpactFeedbackStyle,
  performAndroidHapticsAsync,
  selectionAsync,
} from "expo-haptics";
import { Platform } from "react-native";

/** A device without the haptics API rejects: nothing to feel, nothing to report. */
function feel(ios: () => Promise<void>, android: AndroidHaptics) {
  const run =
    Platform.OS === "android" ? () => performAndroidHapticsAsync(android) : ios;
  run().catch(() => {});
}

/**
 * The player's haptics. shortcut: local to the player until a shared
 * `lib/haptics` exists; move these onto it then.
 */
export const playerHaptics = {
  /** Play, pause, next, previous, and a swipe that changed the song. */
  press: () =>
    feel(
      () => impactAsync(ImpactFeedbackStyle.Light),
      AndroidHaptics.Virtual_Key,
    ),
  /** The seek slider crossing a step while dragged. */
  tick: () => feel(selectionAsync, AndroidHaptics.Segment_Tick),
  /** The seek slider let go. */
  release: () =>
    feel(
      () => impactAsync(ImpactFeedbackStyle.Light),
      AndroidHaptics.Clock_Tick,
    ),
};

/** The seek slider ticks once per this share of the track. */
export const SCRUB_TICK_SHARE = 0.05;

/** Which tick step `seconds` falls in, so a drag ticks when it changes. */
export function scrubStep(seconds: number, duration: number): number {
  return Math.floor(seconds / Math.max(duration * SCRUB_TICK_SHARE, 1));
}
