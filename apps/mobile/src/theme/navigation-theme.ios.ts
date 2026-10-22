import { Color, DarkTheme, DefaultTheme } from "expo-router";
import type { Theme } from "expo-router";
import { useColorScheme } from "react-native";

import { useAccent } from "./appearance";
import { accentColors } from "./tokens";

/**
 * Navigation chrome in UIKit system colours, which resolve light/dark and
 * increased contrast natively. Headers and tab bars keep their system
 * materials (Liquid Glass on iOS 26) because no background is set on them.
 */
export function useNavigationTheme(): Theme {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accent = accentColors(useAccent(), scheme);
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      primary: accent?.primary ?? Color.ios.label,
      background: Color.ios.systemBackground,
      card: Color.ios.secondarySystemBackground,
      text: Color.ios.label,
      border: Color.ios.separator,
      notification: Color.ios.systemRed,
    },
  };
}
