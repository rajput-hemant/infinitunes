import { Color } from "expo-router";
import { Appearance, Platform } from "react-native";

import { withDynamicRoles } from "./dynamic-palette";
import { colors } from "./tokens";
import type { ColorScheme, Palette } from "./tokens";

/** Wallpaper colours exist from Android 12 (API 31); below it the palette stays. */
export const hasDynamicColor = Number(Platform.Version) >= 31;

const cache = new Map<ColorScheme, Palette>();

function currentScheme(): ColorScheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

/**
 * Forget the palettes read so far. The wallpaper (and so every role) can
 * change while the app is in the background, and a cached palette would keep
 * the old colours until the process died; the next `paletteFor` reads anew.
 */
export function refreshDynamicPalettes() {
  cache.clear();
}

/**
 * The token palette in Material You roles. `Color.android.dynamic` resolves a
 * role for the current scheme only, so a scheme is read while it is current
 * and kept from then on. `DynamicColorRoot` points the colour classes at it.
 */
export function paletteFor(scheme: ColorScheme): Palette {
  if (!hasDynamicColor) return colors[scheme];
  const cached = cache.get(scheme);
  if (cached) return cached;
  if (scheme !== currentScheme()) return colors[scheme];
  const palette = withDynamicRoles(
    colors[scheme],
    (role) => Color.android.dynamic[role],
  );
  cache.set(scheme, palette);
  return palette;
}
