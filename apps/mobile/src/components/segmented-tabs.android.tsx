import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Text } from "~/components/ui/text";
import { springs } from "~/theme/motion";
import { sizes, space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

type SegmentedTabsProps<Tab extends string> = {
  tabs: readonly Tab[];
  labels: Record<Tab, string>;
  value: Tab;
  onChange: (tab: Tab) => void;
  testID?: string;
};

const FULL = sizes.ctl / 2;
/** The 40dp segment's slop to the 48dp target. */
const SEGMENT_HIT_SLOP = { top: 4, bottom: 4 } as const;

/**
 * Material 3 Expressive's connected button group (it replaces segmented
 * buttons): 40dp segments 2dp apart, the ends fully round, inner corners
 * small, on `secondaryContainer`; the selected segment turns `primary` (effects
 * spring) and morphs fully round (default spatial spring). No check mark: that is
 * the old segmented button's; Compose's `ToggleButton` (the group's item)
 * marks selection by colour (`Primary`/`OnPrimary`) and shape alone.
 */
export function SegmentedTabs<Tab extends string>({
  tabs,
  labels,
  value,
  onChange,
  testID,
}: SegmentedTabsProps<Tab>) {
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      className="w-full flex-row px-page"
      style={{ gap: sizes.seam }}
    >
      {tabs.map((tab, index) => (
        <Segment
          key={tab}
          label={labels[tab]}
          selected={tab === value}
          first={index === 0}
          last={index === tabs.length - 1}
          onPress={() => onChange(tab)}
        />
      ))}
    </View>
  );
}

function Segment({
  label,
  selected,
  first,
  last,
  onPress,
}: {
  label: string;
  selected: boolean;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const inner = useRadii().sm;
  const selectedFill = useTokenColor("primary");
  const idleFill = useTokenColor("secondary");
  const ripple = usePalette()["fill-2"];
  // 1 is fully round; 0 has the small inner corners.
  const round = useSharedValue(selected ? 1 : 0);
  // The fill follows on the effects spring: colour never overshoots.
  const fill = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    round.set(withSpring(selected ? 1 : 0, springs.spatialDefault));
    fill.set(withSpring(selected ? 1 : 0, springs.effectsDefault));
  }, [selected, round, fill]);
  const shape = useAnimatedStyle(() => {
    const innerRadius = inner + (FULL - inner) * round.get();
    return {
      borderTopLeftRadius: first ? FULL : innerRadius,
      borderBottomLeftRadius: first ? FULL : innerRadius,
      borderTopRightRadius: last ? FULL : innerRadius,
      borderBottomRightRadius: last ? FULL : innerRadius,
      backgroundColor: interpolateColor(
        Math.min(1, Math.max(0, fill.get())),
        [0, 1],
        [idleFill, selectedFill],
      ),
    };
  });

  // The pressable is the clipped, shaped view itself: Android drops a touch
  // outside an `overflow: hidden` parent, so a child's slop never reached 48dp.
  return (
    <AnimatedPressable
      onPress={onPress}
      hitSlop={SEGMENT_HIT_SLOP}
      android_ripple={{ color: ripple, foreground: true }}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.segment, shape]}
    >
      <Text
        variant="label"
        tone={selected ? "onPrimary" : "onSecondary"}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  segment: {
    flex: 1,
    overflow: "hidden",
    minHeight: sizes.ctl,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.sm,
  },
});
