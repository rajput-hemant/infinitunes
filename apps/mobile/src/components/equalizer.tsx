import { useEffect } from "react";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { iconSize, sizes } from "~/theme/tokens";

/** Each bar's rest height (a fraction of the edge) and its bounce period. */
const BARS = [
  { rest: 0.45, period: 420, delay: 0 },
  { rest: 0.8, period: 340, delay: 120 },
  { rest: 0.6, period: 480, delay: 60 },
] as const;

const EDGE = iconSize.sm;
const BAR_WIDTH = 3;
const BAR_GAP = sizes.seam;
/** Paused bars sit low and still. */
const PAUSED_SCALE = 0.25;

function Bar({
  scale,
  color,
}: {
  scale: SharedValue<number>;
  color: ColorValue;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          height: EDGE,
          borderRadius: BAR_WIDTH / 2,
          backgroundColor: color,
          transformOrigin: "bottom",
        },
        style,
      ]}
    />
  );
}

/**
 * The playing track's mark on Android: three bars that bounce while it plays
 * and rest low while paused. Under reduce motion the bars hold still at
 * staggered heights. It loops, it never animates in, so a recycled list cell
 * is fine: each bar's loop is cancelled when it unmounts or stops.
 */
export function Equalizer({
  playing,
  color,
}: {
  playing: boolean;
  color: ColorValue;
}) {
  const reduceMotion = useReducedMotion();
  const first = useSharedValue<number>(BARS[0].rest);
  const second = useSharedValue<number>(BARS[1].rest);
  const third = useSharedValue<number>(BARS[2].rest);

  useEffect(() => {
    const scales = [first, second, third];
    scales.forEach((scale, index) => {
      const bar = BARS[index]!;
      cancelAnimation(scale);
      if (!playing) {
        scale.set(withTiming(PAUSED_SCALE, { duration: 160 }));
      } else if (reduceMotion) {
        scale.set(bar.rest);
      } else {
        scale.set(0.3);
        scale.set(
          withDelay(
            bar.delay,
            withRepeat(
              withTiming(1, {
                duration: bar.period,
                easing: Easing.inOut(Easing.quad),
              }),
              -1,
              true,
            ),
          ),
        );
      }
    });
    return () => scales.forEach((scale) => cancelAnimation(scale));
  }, [playing, reduceMotion, first, second, third]);

  return (
    <View
      className="flex-row items-end justify-center"
      style={{ height: EDGE, width: EDGE, gap: BAR_GAP }}
    >
      <Bar scale={first} color={color} />
      <Bar scale={second} color={color} />
      <Bar scale={third} color={color} />
    </View>
  );
}
