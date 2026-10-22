import { vars } from "nativewind";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import { useAccent, useCornerStyle } from "./appearance";
import { accentColors, scaledRadii } from "./tokens";

/**
 * Applies the listener's accent and corner style: NativeWind variables on a
 * root view override `global.css`'s (`--primary`, `--radius-*`) for every
 * class inside, over the platform palette (`DynamicColorRoot`) it sits in.
 */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accent = useAccent();
  const corners = useCornerStyle();

  const variables = useMemo(() => {
    const colors = accentColors(accent, scheme);
    return vars({
      ...Object.fromEntries(
        Object.entries(scaledRadii(corners)).map(([name, value]) => [
          `--radius-${name}`,
          `${value}px`,
        ]),
      ),
      ...(colors
        ? {
            "--primary": colors.primary,
            "--primary-foreground": colors.foreground,
          }
        : {}),
    });
  }, [accent, corners, scheme]);

  return <View style={[styles.root, variables]}>{children}</View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
