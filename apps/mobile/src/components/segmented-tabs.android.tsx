import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Text } from "~/components/ui/text";
import { springs } from "~/theme/motion";
import { sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";
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
 * small, on `secondaryContainer`; the selected segment turns `primary` and
 * morphs fully round on the default spatial spring.
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
  // 1 is fully round; 0 has the small inner corners.
  const round = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    round.set(withSpring(selected ? 1 : 0, springs.spatialDefault));
  }, [selected, round]);
  const shape = useAnimatedStyle(() => {
    const innerRadius = inner + (FULL - inner) * round.get();
    return {
      borderTopLeftRadius: first ? FULL : innerRadius,
      borderBottomLeftRadius: first ? FULL : innerRadius,
      borderTopRightRadius: last ? FULL : innerRadius,
      borderBottomRightRadius: last ? FULL : innerRadius,
    };
  });

  return (
    <Animated.View
      style={[
        { flex: 1, overflow: "hidden" },
        { backgroundColor: selected ? selectedFill : idleFill },
        shape,
      ]}
    >
      <Pressable
        onPress={onPress}
        hitSlop={SEGMENT_HIT_SLOP}
        android_ripple={{ color: "rgba(127, 127, 127, 0.2)" }}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        className="min-h-ctl items-center justify-center px-2"
      >
        <Text
          variant="label"
          tone={selected ? "onPrimary" : "onSecondary"}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
