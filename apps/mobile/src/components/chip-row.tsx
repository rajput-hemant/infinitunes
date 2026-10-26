import { useEffect, useRef } from "react";
import { Platform, Pressable, ScrollView } from "react-native";
import type { LayoutChangeEvent, ScrollViewInstance } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { cx } from "~/lib/class-names";
import { selection } from "~/lib/haptics";
import { usePressScale } from "~/lib/use-press-scale";
import { sizes, space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

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

type Span = { x: number; width: number };

/**
 * Where to scroll so a chip shows whole with the page gutter beside it, or
 * `undefined` when it already does (a tapped chip never moves under the finger).
 */
export function revealOffset(
  offset: number,
  viewport: number,
  chip: Span,
): number | undefined {
  const start = chip.x - sizes.page;
  const end = chip.x + chip.width + sizes.page - viewport;
  if (offset > start) return Math.max(0, start);
  if (offset < end) return end;
  return undefined;
}

/**
 * Android fades the trailing edge while chips run past it (the native fading
 * edge shows only while content continues that way). iOS keeps the clipped
 * trailing chip as its overflow cue: a fade there would need the background's
 * system colour as a gradient stop, which a `PlatformColor` cannot be.
 */
const FADING_EDGE = { start: 0, end: space.xl };

/**
 * A horizontally scrolling row of filter chips (capsules); the selected one
 * is filled and scrolled into view (at once on mount, then animated unless
 * reduce motion is on). A tap lands while the keyboard is up (search's field
 * keeps it).
 */
export function ChipRow({ chips, tabs = false }: ChipRowProps) {
  const scroller = useRef<ScrollViewInstance>(null);
  const viewport = useRef({ width: 0, offset: 0 });
  const frames = useRef(new Map<string, Span>());
  /** The selection last scrolled into view; undefined until the first placement. */
  const shown = useRef<{ key: string | undefined }>(undefined);
  const reduceMotion = useReducedMotion();
  const selected = chips.find((chip) => chip.selected)?.key;

  /** Scrolls the selected chip into view; false while it is unmeasured. */
  const reveal = (animated: boolean): boolean => {
    const frame =
      selected === undefined ? undefined : frames.current.get(selected);
    const { width, offset } = viewport.current;
    if (!frame || !width) return false;
    const x = revealOffset(offset, width, frame);
    if (x !== undefined) scroller.current?.scrollTo({ x, animated });
    shown.current = { key: selected };
    return true;
  };
  // The first placement happens on layout, without animation.
  const place = () => {
    if (!shown.current) reveal(false);
  };

  // Later, only a new selection scrolls (never a re-render the listener scrolled past).
  useEffect(() => {
    if (shown.current && shown.current.key !== selected) reveal(!reduceMotion);
  });

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityRole={tabs ? "tablist" : undefined}
      contentContainerClassName="gap-2 px-page py-2"
      fadingEdgeLength={FADING_EDGE}
      scrollEventThrottle={16}
      onScroll={(event) => {
        viewport.current.offset = event.nativeEvent.contentOffset.x;
      }}
      onLayout={(event) => {
        viewport.current.width = event.nativeEvent.layout.width;
        place();
      }}
    >
      {chips.map((chip) => (
        <ChipButton
          key={chip.key}
          chip={chip}
          tab={tabs}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            frames.current.set(chip.key, { x, width });
            if (chip.selected) place();
          }}
        />
      ))}
    </ScrollView>
  );
}

/**
 * One chip: on iOS it sinks a little under the finger and springs back;
 * Material 3 chips only ripple.
 */
function ChipButton({
  chip,
  tab,
  onLayout,
}: {
  chip: Chip;
  tab: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const press = usePressScale();
  const onSecondary = useTokenColor("secondary-foreground");
  const ripple = usePalette()["fill-2"];
  const { container, tone } = chip.selected
    ? CHIP_STYLE.selected
    : CHIP_STYLE.idle;
  return (
    <Animated.View
      style={MATERIAL ? undefined : press.style}
      onLayout={onLayout}
    >
      <Pressable
        onPress={() => {
          if (!chip.selected) selection();
          chip.onPress?.();
        }}
        onPressIn={MATERIAL ? undefined : press.onPressIn}
        onPressOut={MATERIAL ? undefined : press.onPressOut}
        android_ripple={MATERIAL ? { color: ripple } : undefined}
        hitSlop={CHIP_HIT_SLOP}
        accessibilityRole={tab ? "tab" : "button"}
        accessibilityState={{ selected: chip.selected }}
        className={cx(
          "min-h-8 flex-row items-center justify-center gap-1 px-3",
          !MATERIAL && "active:opacity-80",
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
