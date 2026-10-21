import { Color } from "expo-router";
import { StyleSheet } from "nativewind";
import { Appearance, Platform } from "react-native";

import { toRootVariables, withDynamicRoles } from "./dynamic-palette";
import { colors } from "./tokens";
import type { ColorScheme, Palette } from "./tokens";

/** Wallpaper colours exist from Android 12 (API 31); below it the palette stays. */
const hasDynamicColor = Number(Platform.Version) >= 31;

const cache = new Map<ColorScheme, Palette>();

function currentScheme(): ColorScheme {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

/**
 * The token palette in Material You roles. `Color.android.dynamic` resolves a
 * role for the current scheme only, so a scheme is read while it is current
 * and kept until the next switch.
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

function register(scheme: ColorScheme) {
  StyleSheet.registerCompiled({
    $compiled: true,
    rootVariables: toRootVariables(paletteFor(scheme), scheme),
  });
}

/**
 * Points the colour classes (`bg-card`, `text-primary`) at the wallpaper's
 * Material You roles, as the navigation chrome already is: the root CSS
 * variables of the current scheme now, the other one when the scheme
 * switches. Call it once, after `global.css` has registered the palette.
 */
export function installDynamicColors() {
  if (!hasDynamicColor) return;
  register(currentScheme());
  Appearance.addChangeListener(() => {
    cache.clear();
    register(currentScheme());
  });
}
