import type { MediaType } from "@infinitunes/types";
import { Link } from "expo-router";
import type { Href } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { AccessibilityValue, PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { cx } from "~/lib/class-names";
import { prefetchEntity } from "~/lib/entity-queries";
import { springs } from "~/theme/motion";
import { space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";
import { useRadii } from "~/theme/use-radii";

import { Equalizer } from "./equalizer";
import { ExplicitBadge } from "./explicit-badge";
import { Artwork } from "./ui/artwork";
import { Icon } from "./ui/icon";
import type { SymbolName } from "./ui/icon";
import { Text } from "./ui/text";

export type ListRowLeading =
  | { artwork: string; round?: boolean }
  | { icon: SymbolName }
  | { index: number };

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** The "E" mark, leading the subtitle line. */
  explicit?: boolean;
  /** Artwork (`row` size), an icon tile, or a track number. */
  leading?: ListRowLeading;
  /** At most two 48pt controls (`IconButton`, a `NativeMenu`'s `MenuTrigger`). */
  trailing?: ReactNode;
  /** A disclosure chevron: the row opens a screen (iOS only; Android rows have none). */
  chevron?: boolean;
  /** The row's screen: the row is a link. */
  href?: Href;
  /** What a tap does when the row is not a link. */
  onPress?: () => void;
  /** The catalog item the row opens: pressing in warms its screen's data. */
  entity?: { type: MediaType; url: string };
  /** The current track: accent title, waveform in the leading slot. */
  selected?: boolean;
  /** The current track is paused: the pause mark replaces the waveform. */
  paused?: boolean;
  /**
   * A choice in a multiple-choice list (languages): the row is a checkbox and
   * shows a check mark at its end while on.
   */
  checked?: boolean;
  /** Defaults to the title, "Explicit" and the subtitle. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityValue?: AccessibilityValue;
  /** A long press on the text area (a context menu). */
  onLongPress?: () => void;
  /** Screen reader actions on the text area (what its long press offers). */
  accessibilityActions?: PressableProps["accessibilityActions"];
  onAccessibilityAction?: PressableProps["onAccessibilityAction"];
  /** Wraps the text area's button, e.g. in a link with a context menu. */
  wrap?: (pressable: ReactElement) => ReactElement;
};

/**
 * Android (Material 3 Expressive): the current track sits in a tonal
 * container. Read at render, so a test can switch platforms.
 */
const tonalNowPlaying = () => Platform.OS === "android";

/** What the leading slot shows for the current track. */
type NowPlaying = "playing" | "paused" | undefined;

/**
 * The current track's mark on both platforms: bars that bounce while playing
 * and rest low and still while paused (Apple Music's and YouTube Music's
 * cue). A pause glyph read as "tap to pause" while the mini player offered
 * Play, so a paused row now shows a state, not an action.
 */
function NowMark({
  nowPlaying,
  color,
}: {
  nowPlaying: "playing" | "paused";
  color: string;
}) {
  return (
    <View testID={`now-${nowPlaying}`}>
      <Equalizer playing={nowPlaying === "playing"} color={color} />
    </View>
  );
}

function Leading({
  leading,
  nowPlaying,
  dimmed,
}: {
  leading: ListRowLeading;
  nowPlaying: NowPlaying;
  /** A row without a destination: only the picture dims. */
  dimmed: boolean;
}) {
  const palette = usePalette();
  // On Android's tonal container the mark takes the container's text colour.
  const markColor = tonalNowPlaying()
    ? palette["secondary-foreground"]
    : palette.primary;
  if ("index" in leading) {
    return (
      <View className="w-touch items-center">
        {nowPlaying ? (
          <NowMark nowPlaying={nowPlaying} color={markColor} />
        ) : (
          <Text tone="muted" numeric>
            {leading.index}
          </Text>
        )}
      </View>
    );
  }
  if ("icon" in leading) {
    // Android: Material 3's leading icon in a round tonal container.
    return (
      <View
        className={cx(
          "size-touch items-center justify-center",
          Platform.OS === "android"
            ? "rounded-full bg-secondary"
            : "rounded-sm bg-fill",
          dimmed && "opacity-50",
        )}
      >
        <Icon
          name={leading.icon}
          size="md"
          color={
            Platform.OS === "android"
              ? palette["secondary-foreground"]
              : undefined
          }
        />
      </View>
    );
  }
  return (
    <View testID="list-row-art" className={dimmed ? "opacity-50" : undefined}>
      <Artwork image={leading.artwork} size="row" round={leading.round} />
      {nowPlaying ? (
        <View
          className={cx(
            "absolute inset-0 items-center justify-center bg-scrim",
            leading.round ? "rounded-full" : "rounded-sm",
          )}
        >
          <NowMark nowPlaying={nowPlaying} color="white" />
        </View>
      ) : null}
    </View>
  );
}

/**
 * The one list row (songs, media, library entries, searches): a leading
 * slot, a title over an optional subtitle, and trailing controls. The text
 * area is the row's link or button; trailing controls are its siblings so
 * screen readers reach each. No separators; it grows with Dynamic Type.
 */
export function ListRow({
  title,
  subtitle,
  explicit = false,
  leading,
  trailing,
  chevron = false,
  href,
  onPress,
  entity,
  selected = false,
  paused = false,
  checked,
  accessibilityLabel,
  accessibilityHint,
  accessibilityValue,
  onLongPress,
  accessibilityActions,
  onAccessibilityAction,
  wrap,
}: ListRowProps) {
  const palette = usePalette();
  const primary = useTokenColor("primary");
  const [pressed, setPressed] = useState(false);
  const controls = trailing;
  const dimmed = !href && !onPress;
  const nowPlaying: NowPlaying = selected
    ? paused
      ? "paused"
      : "playing"
    : undefined;
  const label =
    accessibilityLabel ??
    [title, explicit && "Explicit", subtitle].filter(Boolean).join(", ");

  const body = (
    <>
      {leading ? (
        <Leading leading={leading} nowPlaying={nowPlaying} dimmed={dimmed} />
      ) : null}
      <View className="flex-1">
        <Text
          numberOfLines={1}
          tone={
            selected
              ? tonalNowPlaying()
                ? "onSecondary"
                : "primary"
              : "default"
          }
          emphasized={selected}
        >
          {title}
        </Text>
        {subtitle || explicit ? (
          <View className="flex-row items-center gap-1">
            {/* The row's label already says "Explicit". */}
            {explicit ? <ExplicitBadge accessible={false} /> : null}
            {subtitle ? (
              <Text
                variant="footnote"
                tone="muted"
                numberOfLines={1}
                className="shrink"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {/* iOS marks only the chosen rows; Material 3 shows every row's checkbox. */}
      {checked !== undefined && Platform.OS === "android" ? (
        <Icon
          name={{
            ios: "checkmark",
            android: checked ? "check_box" : "check_box_outline_blank",
          }}
          size="lg"
          color={checked ? primary : palette["muted-foreground"]}
        />
      ) : checked ? (
        <Icon
          name={{ ios: "checkmark", android: "check" }}
          size="md"
          color={primary}
        />
      ) : null}
      {chevron && Platform.OS === "ios" ? (
        <Icon
          name={{ ios: "chevron.right", android: "chevron_right" }}
          size="sm"
          color={palette["muted-foreground"]}
        />
      ) : null}
    </>
  );
  const android = tonalNowPlaying();
  const hasControls =
    controls !== undefined && controls !== null && controls !== false;
  // Beside controls the row ends 4dp in; the current track's container ends
  // there too, so the controls do not move when a row becomes current.
  const endPad = hasControls ? space.xs : space.lg;
  const endInset = android ? (hasControls ? space.xs : space.sm) : 0;
  // Android's tonal container insets the start by `space.sm` while current;
  // a plain row keeps that much as padding, so the content keeps its place.
  const bodyClass = "min-h-row flex-1 flex-row items-center gap-3 py-1";
  const bodyStyle = { paddingStart: space.lg - (android ? space.sm : 0) };
  const tonal = useTonalContainer(selected && !dimmed, endPad, endInset);

  // An item without a screen is a labelled view, never a disabled button;
  // only its picture dims (`Leading`), so the text keeps its contrast.
  if (dimmed) {
    return (
      <View className="flex-row items-center" style={{ paddingEnd: endPad }}>
        <View
          accessible
          accessibilityLabel={label}
          className={bodyClass}
          style={bodyStyle}
        >
          {body}
        </View>
        {controls}
      </View>
    );
  }

  const pressable = (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      onPressIn={() => {
        setPressed(true);
        if (entity) prefetchEntity(entity.type, entity.url);
      }}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: palette["fill-2"], foreground: true }}
      accessibilityRole={
        checked !== undefined ? "checkbox" : href ? "link" : "button"
      }
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityValue={accessibilityValue}
      accessibilityState={checked !== undefined ? { checked } : { selected }}
      className={bodyClass}
      style={bodyStyle}
    >
      {body}
    </Pressable>
  );
  const content = href ? (
    <Link href={href} asChild>
      {pressable}
    </Link>
  ) : (
    (wrap?.(pressable) ?? pressable)
  );

  if (!android) {
    return (
      <View
        className={cx("flex-row items-center", pressed && "bg-fill-2")}
        style={{ paddingEnd: endPad }}
      >
        {content}
        {controls}
      </View>
    );
  }
  return (
    <Animated.View
      className="flex-row items-center overflow-hidden"
      style={tonal.style}
    >
      <Animated.View
        testID="list-row-container"
        pointerEvents="none"
        className="bg-secondary"
        style={[StyleSheet.absoluteFill, tonal.background]}
      />
      {content}
      {controls}
    </Animated.View>
  );
}

/**
 * The current track's tonal container (Android): margins and padding on the
 * spatial spring, the fill on the effects spring; both follow the system's
 * reduce motion setting. A row starts at rest, so a mount does not animate.
 */
function useTonalContainer(current: boolean, endPad: number, endInset: number) {
  const radius = useRadii().lg;
  const place = useSharedValue(current ? 1 : 0);
  const fill = useSharedValue(current ? 1 : 0);
  useEffect(() => {
    place.set(withSpring(current ? 1 : 0, springs.spatialDefault));
    fill.set(withSpring(current ? 1 : 0, springs.effectsDefault));
  }, [current, place, fill]);
  const style = useAnimatedStyle(() => {
    // A spring may overshoot; a length may not go negative.
    const on = place.get();
    return {
      marginStart: Math.max(0, space.sm * on),
      marginEnd: Math.max(0, endInset * on),
      paddingStart: Math.max(0, space.sm * (1 - on)),
      paddingEnd: Math.max(0, endPad - endInset * on),
      borderRadius: Math.max(0, radius * on),
    };
  });
  const background = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, fill.get())),
  }));
  return { style, background };
}
