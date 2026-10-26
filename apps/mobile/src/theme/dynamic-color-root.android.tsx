import { vars } from "nativewind";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AppState, StyleSheet, useColorScheme, View } from "react-native";

// Named in full: the plain module (iOS, type-checking) has no `hasDynamicColor`.
import {
  hasDynamicColor,
  paletteFor,
  refreshDynamicPalettes,
} from "./android-colors.android";
import { toVariables } from "./dynamic-palette";

/**
 * Points the colour classes (`bg-card`, `text-primary`) of everything inside
 * at the wallpaper's Material You roles (Android 12+), the colours the
 * navigation chrome already uses: NativeWind variables set on this root view
 * override the palette `global.css` registered, for the current scheme.
 */
export function DynamicColorRoot({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  // The wallpaper may have changed while the app was away: read the roles anew.
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (!hasDynamicColor) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      refreshDynamicPalettes();
      setGeneration((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);
  // Rendered again only for the scheme or a refresh (the children keep their
  // identity), so the variables need no memo; `generation` says why we are here.
  const variables =
    hasDynamicColor && generation >= 0
      ? vars(toVariables(paletteFor(scheme)))
      : undefined;
  return <View style={[styles.root, variables]}>{children}</View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
