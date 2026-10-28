import { Color, DarkTheme, DefaultTheme } from "expo-router";
import type { Theme } from "expo-router";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { useAccent } from "./appearance";
import { usePalette } from "./use-palette";

/**
 * Navigation chrome in Material 3 dynamic colour roles (Material You), taken
 * from the wallpaper on Android 12+ and from the baseline scheme before.
 * Reading the scheme here re-renders the theme when the system mode flips.
 * A custom accent replaces the wallpaper with its own scheme (`usePalette`),
 * so the chrome stays on the page's surface.
 */
export function useNavigationTheme(): Theme {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = usePalette();
  const accented = useAccent() !== "default";
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return useMemo(() => {
    if (accented) {
      return {
        ...base,
        colors: {
          primary: palette.primary,
          background: palette.background,
          card: palette.background,
          text: palette.foreground,
          border: palette.border,
          notification: palette.destructive,
        },
      };
    }
    const { dynamic } = Color.android;
    return {
      ...base,
      colors: {
        primary: dynamic.primary,
        background: dynamic.surface,
        // The top app bar sits on the page's surface (Material 3), not a band.
        card: dynamic.surface,
        text: dynamic.onSurface,
        border: dynamic.outlineVariant,
        notification: dynamic.error,
      },
    };
  }, [base, accented, palette]);
}
