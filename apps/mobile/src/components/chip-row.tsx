import { Pressable, ScrollView } from "react-native";

import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";

/** The chip is 40pt tall; slop above and below makes the 48pt target. */
export const CHIP_HIT_SLOP = { top: 4, bottom: 4 } as const;

export type Chip = {
  key: string;
  label: string;
  selected: boolean;
  onPress?: () => void;
};

/** A horizontally scrolling row of filter chips; the selected one is filled. */
export function ChipRow({ chips }: { chips: readonly Chip[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-page py-2"
    >
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={chip.onPress}
          hitSlop={CHIP_HIT_SLOP}
          accessibilityRole="button"
          accessibilityState={{ selected: chip.selected }}
          className={cx(
            "min-h-ctl justify-center rounded-full px-4 py-1 active:opacity-70",
            chip.selected ? "bg-primary" : "bg-fill",
          )}
        >
          <Text
            variant="subhead"
            tone={chip.selected ? "onPrimary" : "default"}
          >
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
