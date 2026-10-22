import { Platform } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { WithSpringConfig } from "react-native-reanimated";

import { iosPressRelease, springs } from "~/theme/motion";

const PRESSED = 0.96;
const PRESS_IN = { duration: 90 };

/** Android springs back on Material 3 Expressive's fast spatial spring. */
const RELEASE = Platform.select<WithSpringConfig>({
  android: springs.spatialFast,
  default: iosPressRelease,
});

/**
 * A press that sinks the pressed thing a little and springs it back: spread
 * the handlers on the `Pressable`, put `style` on an `Animated.View` around
 * what should shrink (a card's art, a whole tile). Worklet animations follow
 * the system's reduce motion setting on their own (`ReduceMotion.System`).
 */
export function usePressScale(pressed = PRESSED) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return {
    style,
    onPressIn: () => {
      scale.set(withTiming(pressed, PRESS_IN));
    },
    onPressOut: () => {
      scale.set(withSpring(1, RELEASE));
    },
  };
}
