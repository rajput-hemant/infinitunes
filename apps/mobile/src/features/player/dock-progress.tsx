import { View } from "react-native";
import type { ColorValue } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useProgressValues } from "./progress-values";

/** The progress line's thickness (spec 2.10). */
const LINE = 2;

/**
 * The 2pt progress line along the floating dock's bottom edge, clipped by
 * the dock's radius. Decoration only: the full player's scrubber is the
 * accessible position, so screen readers skip it. Both segments are
 * full-width bars scaled from the left edge on the UI thread, so a playhead
 * tick neither re-renders React nor lays the line out again.
 */
export function DockProgress({ color }: { color: ColorValue }) {
  const { played, buffered } = useProgressValues();
  const bufferedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: buffered.get() }],
  }));
  const playedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: played.get() }],
  }));

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
      <Animated.View
        testID="dock-buffered"
        style={[
          {
            position: "absolute",
            height: LINE,
            width: "100%",
            transformOrigin: "left",
            backgroundColor: color,
            opacity: 0.35,
          },
          bufferedStyle,
        ]}
      />
      <Animated.View
        testID="dock-progress"
        style={[
          {
            height: LINE,
            width: "100%",
            transformOrigin: "left",
            backgroundColor: color,
          },
          playedStyle,
        ]}
      />
    </View>
  );
}
