import { useMemo } from "react";
import {
  Platform,
  PlatformColor as platformColor,
  useColorScheme,
} from "react-native";
import type { ColorValue } from "react-native";

import { withAccent } from "./accent-palette";
import { paletteFor } from "./android-colors";
import { useAccent } from "./appearance";
import { usePlayingAccent } from "./playing-accent";
import { ACCENT_TOKENS, iosSystemColors } from "./tokens";
import type { ColorToken, Palette } from "./tokens";

/**
 * The token palette of the current colour scheme, for the few props that take
 * a colour instead of a class (a placeholder). On Android 12+ it holds the
 * Material You roles the classes resolve to, or with a custom accent the
 * scheme built from it (`accent-palette`). Prefer semantic classes.
 */
export function usePalette(): Palette {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const base = paletteFor(scheme);
  const accent = useAccent();
  return useMemo(
    () => withAccent(base, accent, scheme),
    [base, accent, scheme],
  );
}

/**
 * One token as a colour prop (an icon's tint), exactly as its class resolves:
 * the UIKit system colour on iOS when the token has one, else the palette.
 */
export function useTokenColor(token: ColorToken): ColorValue {
  const palette = usePalette();
  // `primary` follows the accent class (a variable), not the UIKit label colour.
  const systemColor =
    Platform.OS === "ios" && !ACCENT_TOKENS.includes(token as never)
      ? iosSystemColors[token]
      : undefined;
  return systemColor ? platformColor(systemColor) : palette[token];
}

/**
 * The tab bar's tint: an explicit accent, else (Android) the playing accent,
 * else undefined to keep the system tint.
 */
export function useTabAccent(): string | undefined {
  const palette = usePalette();
  const playing = usePlayingAccent();
  return useAccent() === "default" ? playing?.primary : palette.primary;
}
