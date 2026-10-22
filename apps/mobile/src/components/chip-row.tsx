import { Platform, Pressable, ScrollView } from "react-native";
import Animated from "react-native-reanimated";

import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { usePressScale } from "~/lib/use-press-scale";
import { useTokenColor } from "~/theme/use-palette";

const SEMIBOLD = { fontWeight: "600" } as const;

/** The chip is 32pt tall; slop above and below makes the 48pt target. */
export const CHIP_HIT_SLOP = { top: 8, bottom: 8 } as const;

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
    idle: { container: "border border-border", tone: "muted" },
  },
  default: {
    selected: { container: "bg-primary", tone: "onPrimary" },
    idle: { container: "border border-border bg-fill", tone: "default" },
  },
} as const);

/**
 * Material 3's filter chip has the small shape (8dp), a label-large label and
 * a leading check while selected; iOS keeps capsules.
 */
const MATERIAL = Platform.OS === "android";
const CHIP_SHAPE = MATERIAL ? "rounded-sm" : "rounded-full";
const CHECK: SymbolName = { ios: "checkmark", android: "check" };

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
      {chips.map((chip) => (
        <ChipButton key={chip.key} chip={chip} tab={tabs} />
      ))}
    </ScrollView>
  );
}

/** One chip: it sinks a little under the finger and springs back. */
function ChipButton({ chip, tab }: { chip: Chip; tab: boolean }) {
  const press = usePressScale();
  const onSecondary = useTokenColor("secondary-foreground");
  const { container, tone } = chip.selected
    ? CHIP_STYLE.selected
    : CHIP_STYLE.idle;
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={chip.onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        hitSlop={CHIP_HIT_SLOP}
        accessibilityRole={tab ? "tab" : "button"}
        accessibilityState={{ selected: chip.selected }}
        className={cx(
          "min-h-8 flex-row items-center justify-center gap-1 px-3 active:opacity-80",
          CHIP_SHAPE,
          container,
        )}
      >
        {chip.icon ? (
          <Icon name={chip.icon} size="sm" weight="semibold" />
        ) : MATERIAL && chip.selected ? (
          <Icon name={CHECK} size="sm" color={onSecondary} />
        ) : null}
        <Text
          variant={MATERIAL ? "label" : "footnote"}
          tone={tone}
          style={chip.selected && !MATERIAL ? SEMIBOLD : undefined}
        >
          {chip.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
