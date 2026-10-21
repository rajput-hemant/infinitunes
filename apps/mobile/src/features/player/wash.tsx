import { ThemeProvider, useTheme } from "expo-router";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";

import { Text } from "~/components/ui/text";
import type { TextProps } from "~/components/ui/text";
import type { OnSurfaceColors, PlayerColors } from "~/lib/artwork-colors";

/** What the player's controls read while they sit on an artwork wash. */
export type WashColors = OnSurfaceColors & {
  /** The play/pause shape and its glyph. */
  control: string;
  onControl: string;
  /** The scrubber's unplayed track (Android's slider). */
  track: string;
};

const WashContext = createContext<WashColors | null>(null);

/** The wash's colours, or `null` on the D1 palette (use the token classes). */
export function useWashColors() {
  return useContext(WashContext);
}

/** Now Playing's content colours. */
export function nowPlayingWash(colors: PlayerColors): WashColors {
  const { foreground, muted, accent, control, onControl, track } = colors;
  return { foreground, muted, accent, control, onControl, track };
}

/** The floating dock's content colours. */
export function dockWash({ dock }: PlayerColors): WashColors {
  return {
    ...dock,
    control: dock.accent,
    onControl: dock.background,
    track: dock.muted,
  };
}

/**
 * Lays `children` on a wash: `WashText` and every control that reads the
 * navigation theme (icons, the heart, menu triggers) take its contrast-checked
 * colours. `null` leaves the D1 palette in place.
 */
export function OnWash({
  colors,
  children,
}: {
  colors: WashColors | null;
  children: ReactNode;
}) {
  const theme = useTheme();
  const washTheme = useMemo(
    () =>
      colors
        ? {
            ...theme,
            colors: {
              ...theme.colors,
              text: colors.foreground,
              primary: colors.accent,
            },
          }
        : theme,
    [theme, colors],
  );
  return (
    <WashContext.Provider value={colors}>
      <ThemeProvider value={washTheme}>{children}</ThemeProvider>
    </WashContext.Provider>
  );
}

type WashTextProps = Omit<TextProps, "tone"> & { tone?: "default" | "muted" };

/** `Text` in the wash's foreground or muted colour, the token tone without one. */
export function WashText({ tone = "default", style, ...props }: WashTextProps) {
  const wash = useWashColors();
  if (!wash) return <Text tone={tone} style={style} {...props} />;
  const color = tone === "muted" ? wash.muted : wash.foreground;
  return <Text style={[{ color }, style]} {...props} />;
}

/** One painted surface: `key` names what it shows, so a change crossfades. */
export type BackdropFill = { key: string; style: ViewStyle };

/** A top-to-bottom gradient between the wash's two stops. */
export function gradientFill([top, bottom]: readonly [string, string]) {
  return {
    key: `${top}-${bottom}`,
    style: { backgroundImage: `linear-gradient(180deg, ${top}, ${bottom})` },
  } satisfies BackdropFill;
}

/**
 * A crossfade carries no movement, so it stays under reduce motion (the
 * repo's "motion is never zero" rule): only the opacity changes.
 */
const CROSSFADE = FadeIn.duration(450).reduceMotion(ReduceMotion.Never);

/**
 * Fills its parent with `fill`; a new fill fades in over the previous one,
 * so the wash changes with the track instead of flashing.
 */
export function Backdrop({ fill }: { fill: BackdropFill }) {
  const [layers, setLayers] = useState<{
    current: BackdropFill;
    previous: BackdropFill | null;
  }>({ current: fill, previous: null });
  if (layers.current.key !== fill.key) {
    setLayers({ current: fill, previous: layers.current });
  }

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="player-backdrop"
    >
      {layers.previous ? (
        <View style={[StyleSheet.absoluteFill, layers.previous.style]} />
      ) : null}
      <Animated.View
        key={layers.current.key}
        entering={layers.previous ? CROSSFADE : undefined}
        style={[StyleSheet.absoluteFill, layers.current.style]}
        testID="player-backdrop-current"
      />
    </View>
  );
}
