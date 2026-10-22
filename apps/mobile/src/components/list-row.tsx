import { Link } from "expo-router";
import type { Href } from "expo-router";
import { isValidElement, useState } from "react";
import type { ReactNode } from "react";
import { Platform, Pressable, View } from "react-native";
import type { AccessibilityValue } from "react-native";

import { cx } from "~/lib/class-names";
import { space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

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

/** A disclosure chevron (iOS only; Android rows have none). */
export type ListRowChevron = { chevron: true };

type ListRowProps = {
  title: string;
  subtitle?: string;
  /** The "E" mark, leading the subtitle line. */
  explicit?: boolean;
  /** Artwork (`row` size), an icon tile, or a track number. */
  leading?: ListRowLeading;
  /** At most two 48pt controls (`IconButton`, a `NativeMenu`'s `MenuTrigger`), or a chevron. */
  trailing?: ReactNode | ListRowChevron;
  /** The row's screen: the row is a link. */
  href?: Href;
  /** What a tap does when the row is not a link. */
  onPress?: () => void;
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
};

const WAVEFORM: SymbolName = { ios: "waveform", android: "graphic_eq" };
const PAUSED: SymbolName = { ios: "pause.fill", android: "pause" };

/**
 * Android (Material 3 Expressive): the current track sits in a tonal
 * container. Read at render, so a test can switch platforms.
 */
const tonalNowPlaying = () => Platform.OS === "android";

/** What the leading slot shows for the current track. */
type NowPlaying = "playing" | "paused" | undefined;

function isChevron(
  trailing: ListRowProps["trailing"],
): trailing is ListRowChevron {
  return (
    typeof trailing === "object" &&
    trailing !== null &&
    !isValidElement(trailing) &&
    "chevron" in trailing
  );
}

/** The current track's mark: iOS's waveform or pause glyph, Android's equalizer. */
function NowMark({
  nowPlaying,
  color,
}: {
  nowPlaying: "playing" | "paused";
  color: string;
}) {
  return (
    <View testID={`now-${nowPlaying}`}>
      {Platform.OS === "android" ? (
        <Equalizer playing={nowPlaying === "playing"} color={color} />
      ) : (
        <Icon
          name={nowPlaying === "paused" ? PAUSED : WAVEFORM}
          size="sm"
          color={color}
        />
      )}
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
  href,
  onPress,
  selected = false,
  paused = false,
  checked,
  accessibilityLabel,
  accessibilityHint,
  accessibilityValue,
}: ListRowProps) {
  const palette = usePalette();
  const primary = useTokenColor("primary");
  const [pressed, setPressed] = useState(false);
  const chevron = isChevron(trailing);
  const controls = chevron ? null : trailing;
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
  // Android's tonal container is inset by `space.sm` on both sides; the
  // padding inside shrinks by as much, so its contents keep their place.
  const inset = tonalNowPlaying() && selected ? space.sm : 0;
  const bodyClass = "min-h-row flex-1 flex-row items-center gap-3 py-1";
  const bodyStyle = { paddingStart: space.lg - inset };
  const endPadding = {
    paddingEnd: Math.max(0, (controls ? space.xs : space.lg) - inset),
  };
  const container = inset ? { marginHorizontal: inset } : undefined;

  // An item without a screen is a labelled view, never a disabled button;
  // only its picture dims (`Leading`), so the text keeps its contrast.
  if (dimmed) {
    return (
      <View className="flex-row items-center" style={endPadding}>
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
      onPressIn={() => setPressed(true)}
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
  return (
    <View
      className={cx(
        "flex-row items-center",
        pressed && Platform.OS === "ios" && "bg-fill-2",
        container && "overflow-hidden rounded-lg bg-secondary",
      )}
      style={[endPadding, container]}
    >
      {href ? (
        <Link href={href} asChild>
          {pressable}
        </Link>
      ) : (
        pressable
      )}
      {controls}
    </View>
  );
}
