import { HeaderHeightContext } from "expo-router/react-navigation";
import { use } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import type { ColorToken } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

/** The scrim's opacity: clear at the top, opaque once a bar's height has scrolled under it. */
export function scrimOpacity(offset: number, height: number): number {
  "worklet";
  if (height <= 0) return offset > 0 ? 1 : 0;
  return Math.min(Math.max(offset / height, 0), 1);
}

type BarScrimProps = {
  /** The page's scroll offset. */
  offset: SharedValue<number>;
  /** What fades in as content scrolls under the bar. */
  color: ColorToken;
  /** An opaque layer under it, for a bar that is never see-through. */
  base?: ColorToken;
};

/**
 * Android's top bar background (a native-stack `headerBackground`): a layer
 * that fades in with the scroll offset on the UI thread, instead of swapping
 * the bar's colour in one frame. Detail screens fade the page `background`
 * in over the wash under their transparent bar; root screens fade `card` in
 * over the surface (Material 3's scrolled app bar).
 */
export function BarScrim({ offset, color, base }: BarScrimProps) {
  const palette = usePalette();
  const height = use(HeaderHeightContext) ?? 0;
  const fade = useAnimatedStyle(() => ({
    opacity: scrimOpacity(offset.value, height),
  }));
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        base ? { backgroundColor: palette[base] } : null,
      ]}
    >
      <Animated.View
        testID="bar-scrim"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: palette[color] },
          fade,
        ]}
      />
    </View>
  );
}
