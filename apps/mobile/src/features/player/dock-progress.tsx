import { View } from "react-native";
import type { ColorValue } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useProgressValues } from "./progress-values";

/** The progress line's thickness (spec 2.10). */
const LINE = 2;

/**
 * The 2pt progress line along one edge of the dock: the floating dock's
 * bottom (clipped by its radius), or the top of Android's strip, where it
 * also separates the strip from the page. Decoration only: the full player's scrubber is the
 * accessible position, so screen readers skip it. Both segments are
 * full-width bars scaled from the left edge on the UI thread, so a playhead
 * tick neither re-renders React nor lays the line out again.
 */
export function DockProgress({
  color,
  edge = "bottom",
}: {
  color: ColorValue;
  edge?: "top" | "bottom";
}) {
  const { played, buffered } = useProgressValues();
  const bufferedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: buffered.get() }],
  }));
  const playedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: played.get() }],
  }));

  return (
    <View
      testID="dock-line"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        left: 0,
        [edge]: 0,
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
