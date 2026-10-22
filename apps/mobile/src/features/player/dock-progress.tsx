import { View } from "react-native";
import type { ColorValue } from "react-native";

import {
  usePlaybackPosition,
  usePlaybackStatus,
} from "~/playback/playback-status";

/** The progress line's thickness (spec 2.10). */
const LINE = 2;

/**
 * The 2pt progress line along the floating dock's bottom edge, clipped by
 * the dock's radius. Decoration only: the full player's scrubber is the
 * accessible position, so screen readers skip it.
 */
export function DockProgress({ color }: { color: ColorValue }) {
  const position = usePlaybackPosition();
  const duration = usePlaybackStatus((state) => state.duration);
  const bufferedTime = usePlaybackStatus((state) => state.bufferedTime);
  const buffered =
    duration > 0 ? Math.min(Math.max(bufferedTime / duration, 0), 1) : 0;
  const fraction =
    duration > 0 ? Math.min(Math.max(position / duration, 0), 1) : 0;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        height: LINE,
        width: "100%",
      }}
    >
      <View
        testID="dock-buffered"
        style={{
          position: "absolute",
          height: LINE,
          width: `${buffered * 100}%`,
          backgroundColor: color,
          opacity: 0.35,
        }}
      />
      <View
        testID="dock-progress"
        style={{
          height: LINE,
          width: `${fraction * 100}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
