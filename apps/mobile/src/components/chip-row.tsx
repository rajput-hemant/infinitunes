import { Platform, Pressable, ScrollView } from "react-native";

import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";

/** The chip is 40pt tall; slop above and below makes the 48pt target. */
export const CHIP_HIT_SLOP = { top: 4, bottom: 4 } as const;

export type Chip = {
  key: string;
  label: string;
  selected: boolean;
  onPress?: () => void;
  /** A leading symbol, for an action chip among filters (Android's Languages). */
  icon?: SymbolName;
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

type ChipRowProps = {
  chips: readonly Chip[];
  /**
   * The chips switch what the screen below shows (search's result types):
   * a `tablist` of `tab`s. Otherwise each chip is a button (home's languages
   * open a list).
   */
  tabs?: boolean;
};

/**
 * A horizontally scrolling row of filter chips (capsules); the selected one
 * is filled. A tap lands while the keyboard is up (search's field keeps it).
 */
export function ChipRow({ chips, tabs = false }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityRole={tabs ? "tablist" : undefined}
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
            accessibilityRole={tabs ? "tab" : "button"}
            accessibilityState={{ selected: chip.selected }}
            className={cx(
              "min-h-ctl flex-row items-center justify-center gap-2 rounded-full px-4 py-1 active:opacity-70",
              container,
            )}
          >
            {chip.icon ? <Icon name={chip.icon} size="sm" /> : null}
            <Text variant="subhead" tone={tone}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
