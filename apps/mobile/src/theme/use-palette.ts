import {
  Platform,
  PlatformColor as platformColor,
  useColorScheme,
} from "react-native";
import type { ColorValue } from "react-native";

import { paletteFor } from "./android-colors";
import { iosSystemColors } from "./tokens";
import type { ColorToken, Palette } from "./tokens";

/**
 * The token palette of the current colour scheme, for the few props that take
 * a colour instead of a class (a placeholder). On Android 12+ it holds the
 * Material You roles the classes resolve to. Prefer semantic classes.
 */
export function usePalette(): Palette {
  return paletteFor(useColorScheme() === "dark" ? "dark" : "light");
}

/**
 * One token as a colour prop (an icon's tint), exactly as its class resolves:
 * the UIKit system colour on iOS when the token has one, else the palette.
 */
export function useTokenColor(token: ColorToken): ColorValue {
  const palette = usePalette();
  const systemColor =
    Platform.OS === "ios" ? iosSystemColors[token] : undefined;
  return systemColor ? platformColor(systemColor) : palette[token];
}
