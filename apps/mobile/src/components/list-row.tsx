import { Link } from "expo-router";
import type { Href } from "expo-router";
import { isValidElement, useState } from "react";
import type { ReactNode } from "react";
import { Platform, Pressable, View } from "react-native";
import type { AccessibilityValue } from "react-native";

import { cx } from "~/lib/class-names";
import { space } from "~/theme/tokens";
import { usePalette, useTokenColor } from "~/theme/use-palette";

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
  /** Defaults to the title, "Explicit" and the subtitle. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityValue?: AccessibilityValue;
};

const WAVEFORM: SymbolName = { ios: "waveform", android: "graphic_eq" };

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

function Leading({
  leading,
  selected,
}: {
  leading: ListRowLeading;
  selected: boolean;
}) {
  const primary = useTokenColor("primary");
  if ("index" in leading) {
    return (
      <View className="w-touch items-center">
        {selected ? (
          <View testID="now-playing">
            <Icon name={WAVEFORM} size="sm" color={primary} />
          </View>
        ) : (
          <Text tone="muted" numeric>
            {leading.index}
          </Text>
        )}
      </View>
    );
  }
  if ("icon" in leading) {
    return (
      <View className="size-touch items-center justify-center rounded-sm bg-fill">
        <Icon name={leading.icon} size="md" />
      </View>
    );
  }
  return (
    <View>
      <Artwork image={leading.artwork} size="row" round={leading.round} />
      {selected ? (
        <View
          testID="now-playing"
          className={cx(
            "absolute inset-0 items-center justify-center bg-scrim",
            leading.round ? "rounded-full" : "rounded-sm",
          )}
        >
          <Icon name={WAVEFORM} size="sm" color="white" />
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
  accessibilityLabel,
  accessibilityHint,
  accessibilityValue,
}: ListRowProps) {
  const palette = usePalette();
  const [pressed, setPressed] = useState(false);
  const chevron = isChevron(trailing);
  const controls = chevron ? null : trailing;
  const label =
    accessibilityLabel ??
    [title, explicit && "Explicit", subtitle].filter(Boolean).join(", ");

  const body = (
    <>
      {leading ? <Leading leading={leading} selected={selected} /> : null}
      <View className="flex-1">
        <Text numberOfLines={1} tone={selected ? "primary" : "default"}>
          {title}
        </Text>
        {subtitle || explicit ? (
          <View className="flex-row items-center gap-1">
            {explicit ? <ExplicitBadge /> : null}
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
      {chevron && Platform.OS === "ios" ? (
        <Icon
          name={{ ios: "chevron.right", android: "chevron_right" }}
          size="sm"
          color={palette["muted-foreground"]}
        />
      ) : null}
    </>
  );
  const bodyClass = "min-h-row flex-1 flex-row items-center gap-3 py-2 pl-page";
  const endPadding = { paddingEnd: controls ? space.xs : space.lg };

  // An item without a screen is a labelled view, never a disabled button.
  if (!href && !onPress) {
    return (
      <View className="flex-row items-center" style={endPadding}>
        <View
          accessible
          accessibilityLabel={label}
          className={`${bodyClass} opacity-50`}
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
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityValue={accessibilityValue}
      accessibilityState={{ selected }}
      className={bodyClass}
    >
      {body}
    </Pressable>
  );
  return (
    <View
      className={cx(
        "flex-row items-center",
        pressed && Platform.OS === "ios" && "bg-fill-2",
      )}
      style={endPadding}
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
