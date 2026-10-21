import { Platform, Pressable, ScrollView } from "react-native";

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

/**
 * Chip fills per platform: iOS fills the selected chip with the accent;
 * Material 3 filter chips are `secondaryContainer` when selected, outlined
 * otherwise.
 */
const CHIP_STYLE = Platform.select({
  android: {
    selected: { container: "bg-secondary", tone: "onSecondary" },
    idle: { container: "border border-border", tone: "default" },
  },
  default: {
    selected: { container: "bg-primary", tone: "onPrimary" },
    idle: { container: "bg-fill", tone: "default" },
  },
} as const);

/** A horizontally scrolling row of filter chips (capsules); the selected one is filled. */
export function ChipRow({ chips }: { chips: readonly Chip[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-page py-2"
    >
      {chips.map((chip) => {
        const { container, tone } = chip.selected
          ? CHIP_STYLE.selected
          : CHIP_STYLE.idle;
        return (
          <Pressable
            key={chip.key}
            onPress={chip.onPress}
            hitSlop={CHIP_HIT_SLOP}
            accessibilityRole="button"
            accessibilityState={{ selected: chip.selected }}
            className={cx(
              "min-h-ctl justify-center rounded-full px-4 py-1 active:opacity-70",
              container,
            )}
          >
            <Text variant="subhead" tone={tone}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
