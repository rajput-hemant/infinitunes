import { vars } from "nativewind";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ACCENTED_TOKENS } from "./accent-palette";
import { useAccent, useCornerStyle } from "./appearance";
import { scaledRadii } from "./tokens";
import { usePalette } from "./use-palette";

/**
 * Applies the listener's accent and corner style: NativeWind variables on a
 * root view override `global.css`'s (`--primary`, `--radius-*`) for every
 * class inside, over the platform palette (`DynamicColorRoot`) it sits in.
 * On Android the accent sets every colour variable (its own scheme), on iOS
 * only `primary` and its text.
 */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const accent = useAccent();
  const corners = useCornerStyle();
  const palette = usePalette();

  const variables = useMemo(() => {
    return vars({
      ...Object.fromEntries(
        Object.entries(scaledRadii(corners)).map(([name, value]) => [
          `--radius-${name}`,
          `${value}px`,
        ]),
      ),
      ...(accent === "default"
        ? {}
        : Object.fromEntries(
            ACCENTED_TOKENS.map((token) => [`--${token}`, palette[token]]),
          )),
    });
  }, [accent, corners, palette]);

  return <View style={[styles.root, variables]}>{children}</View>;
}

const styles = StyleSheet.create({ root: { flex: 1 } });
