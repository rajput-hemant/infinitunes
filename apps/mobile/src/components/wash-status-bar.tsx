import { useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import { contrastRatio } from "~/lib/artwork-colors";

/** The status bar icons that read on `color`: dark icons on a light wash, light on a dark one. */
export function statusBarStyleOn(color: string): "light" | "dark" {
  return contrastRatio(color, "#000000") >= contrastRatio(color, "#ffffff")
    ? "dark"
    : "light";
}

/**
 * Android: sets the status bar icons from the wash under them while the page
 * is focused (an unfocused page in another tab must not keep its style), so
 * they read on the artwork colour rather than following the app scheme alone.
 */
export function WashStatusBar({ color }: { color: string | undefined }) {
  const focused = useIsFocused();
  if (Platform.OS !== "android" || !color || !focused) return null;
  return <StatusBar style={statusBarStyleOn(color)} />;
}
