import { vars } from "nativewind";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

// Named in full: the plain module (iOS, type-checking) has no `hasDynamicColor`.
import { hasDynamicColor, paletteFor } from "./android-colors.android";
import { toVariables } from "./dynamic-palette";

/**
 * Points the colour classes (`bg-card`, `text-primary`) of everything inside
 * at the wallpaper's Material You roles (Android 12+), the colours the
 * navigation chrome already uses: NativeWind variables set on this root view
 * override the palette `global.css` registered, for the current scheme.
 */
export function DynamicColorRoot({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const variables = useMemo(
    () => (hasDynamicColor ? vars(toVariables(paletteFor(scheme))) : undefined),
    [scheme],
  );
  return <View style={[styles.root, variables]}>{children}</View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
