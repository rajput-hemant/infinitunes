import { Color, DarkTheme, DefaultTheme } from "expo-router";
import type { Theme } from "expo-router";
import { useColorScheme } from "react-native";

import { useAccent } from "./appearance";
import { accentColors } from "./tokens";

/**
 * Navigation chrome in Material 3 dynamic colour roles (Material You), taken
 * from the wallpaper on Android 12+ and from the baseline scheme before.
 * Reading the scheme here re-renders the theme when the system mode flips.
 */
export function useNavigationTheme(): Theme {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accent = accentColors(useAccent(), scheme);
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const { dynamic } = Color.android;
  return {
    ...base,
    colors: {
      primary: accent?.primary ?? dynamic.primary,
      background: dynamic.surface,
      // The top app bar sits on the page's surface (Material 3), not a band.
      card: dynamic.surface,
      text: dynamic.onSurface,
      border: dynamic.outlineVariant,
      notification: dynamic.error,
    },
  };
}
