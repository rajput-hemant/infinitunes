import { Color, DarkTheme, DefaultTheme } from "expo-router";
import type { Theme } from "expo-router";
import { useColorScheme } from "react-native";

/**
 * Navigation chrome in Material 3 dynamic colour roles (Material You), taken
 * from the wallpaper on Android 12+ and from the baseline scheme before.
 * Reading the scheme here re-renders the theme when the system mode flips.
 */
export function useNavigationTheme(): Theme {
  const base = useColorScheme() === "dark" ? DarkTheme : DefaultTheme;
  const { dynamic } = Color.android;
  return {
    ...base,
    colors: {
      primary: dynamic.primary,
      background: dynamic.surface,
      card: dynamic.surfaceContainer,
      text: dynamic.onSurface,
      border: dynamic.outlineVariant,
      notification: dynamic.error,
    },
  };
}
