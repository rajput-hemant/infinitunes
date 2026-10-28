import { ThemeProvider, useTheme } from "expo-router";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Text, TextInkContext } from "~/components/ui/text";
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
 * Lays `children` on a wash: `WashText`, every `Text` in a token tone (the
 * queue's rows; `primary` takes the foreground, the only text colour checked
 * at 4.5:1) and every control that reads the navigation theme (icons, the
 * heart, menu triggers) take its contrast-checked colours. `null` leaves the
 * D1 palette in place.
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
  const ink = useMemo(
    () =>
      colors
        ? {
            default: colors.foreground,
            muted: colors.muted,
            primary: colors.foreground,
          }
        : null,
    [colors],
  );
  return (
    <WashContext.Provider value={colors}>
      <TextInkContext value={ink}>
        <ThemeProvider value={washTheme}>{children}</ThemeProvider>
      </TextInkContext>
    </WashContext.Provider>
  );
}

type WashTextProps = Omit<TextProps, "tone" | "color"> & {
  tone?: "default" | "muted";
};

/** `Text` in the wash's foreground or muted colour, the token tone without one. */
export function WashText({ tone = "default", ...props }: WashTextProps) {
  const wash = useWashColors();
  const color = wash
    ? tone === "muted"
      ? wash.muted
      : wash.foreground
    : undefined;
  return <Text tone={tone} color={color} {...props} />;
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

/** How long a new fill takes to fade in over the ones below (the artwork's crossfade too). */
export const CROSSFADE_MS = 450;

/**
 * A crossfade carries no movement, so it stays under reduce motion (the
 * repo's "motion is never zero" rule): only the opacity changes. `settled`
 * runs once the layer is fully opaque.
 */
function crossfade(settled: () => void) {
  return FadeIn.duration(CROSSFADE_MS)
    .reduceMotion(ReduceMotion.Never)
    .withCallback((finished) => {
      "worklet";
      if (finished) scheduleOnRN(settled);
    });
}

/** One painted layer: `id` keeps two layers of the same fill (A, B, A) apart. */
type Layer = {
  id: number;
  fill: BackdropFill;
  entering: ReturnType<typeof crossfade> | undefined;
};

/**
 * Fills its parent with `fill`; a new fill fades in over the layers below,
 * so the wash changes with the track instead of flashing. Each layer fades
 * over whatever is showing, mid-fade layers included, so skipping A, B, C
 * quickly never snaps; once a layer is opaque the ones under it are dropped.
 * The top layer always paints the latest `fill.style`: a fill whose key stays
 * (the D1 fallback) can still change colour with the scheme.
 */
export function Backdrop({ fill }: { fill: BackdropFill }) {
  const [layers, setLayers] = useState<{ next: number; stack: Layer[] }>(
    () => ({ next: 1, stack: [{ id: 0, fill, entering: undefined }] }),
  );
  const top = layers.stack.at(-1);
  if (top?.fill.key !== fill.key) {
    const id = layers.next;
    const settled = () =>
      setLayers((current) => {
        const index = current.stack.findIndex((layer) => layer.id === id);
        return index > 0
          ? { ...current, stack: current.stack.slice(index) }
          : current;
      });
    setLayers({
      next: id + 1,
      stack: [...layers.stack, { id, fill, entering: crossfade(settled) }],
    });
  }

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID="player-backdrop"
    >
      {layers.stack.map((layer, index) => {
        const isTop = index === layers.stack.length - 1;
        return (
          <Animated.View
            key={layer.id}
            entering={layer.entering}
            style={[StyleSheet.absoluteFill, (isTop ? fill : layer.fill).style]}
            testID={isTop ? "player-backdrop-current" : "player-backdrop-below"}
          />
        );
      })}
    </View>
  );
}
