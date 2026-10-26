/**
 * Semantic design tokens. Screens style with the token names (`bg-background`,
 * `text-muted-foreground`, `rounded-md`, `h-row`), never with a platform's
 * own colours, so they stay platform-agnostic while each platform keeps its
 * native look:
 *
 * - iOS resolves colours to UIKit system colours (`iosSystemColors`), which
 *   follow light/dark mode, contrast settings and Liquid Glass by themselves.
 * - Android 12+ resolves them to Material You roles (`androidDynamicColors`,
 *   applied by `DynamicColorRoot`), the wallpaper colours its navigation
 *   chrome already uses, so content and chrome agree there.
 * - Older Android keeps the neutral palette below, the web theme's
 *   (`apps/web/styles/globals.css`) converted to hex, as the native colour
 *   parser has no `oklch()`. Its chrome takes Material's baseline scheme
 *   (`navigation-theme`), so content and chrome differ in hue there.
 *
 * Navigation chrome takes the same system colours (`navigation-theme`), read
 * in components through `useTheme().colors`.
 *
 * Tailwind (`tailwind.config.ts`) and the app config load this module in
 * Node, so it must not import React Native.
 */

import type { AndroidDynamicMaterialColorType } from "expo-router";

export type ColorScheme = "light" | "dark";

/** A Material 3 colour role (`Color.android.dynamic.<role>`). */
export type M3Role = keyof AndroidDynamicMaterialColorType;

export const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "fill",
  "fill-2",
  "fill-3",
  "scrim",
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

export type Palette = Record<ColorToken, string>;

export const colors: Record<ColorScheme, Palette> = {
  light: {
    background: "#f5f5f7",
    foreground: "#1d1d1f",
    card: "#ffffff",
    "card-foreground": "#1d1d1f",
    primary: "#171717",
    "primary-foreground": "#ffffff",
    secondary: "#eaeaec",
    "secondary-foreground": "#1d1d1f",
    muted: "#eaeaec",
    "muted-foreground": "#66666b",
    accent: "#ebebeb",
    "accent-foreground": "#1d1d1f",
    destructive: "#b71824",
    "destructive-foreground": "#fbfcfd",
    border: "rgba(0, 0, 0, 0.08)",
    input: "#86868b",
    fill: "rgba(0, 0, 0, 0.045)",
    "fill-2": "rgba(0, 0, 0, 0.08)",
    "fill-3": "rgba(0, 0, 0, 0.12)",
    scrim: "rgba(0, 0, 0, 0.28)",
  },
  dark: {
    background: "#0b0b0c",
    foreground: "#f5f5f7",
    card: "#1c1c1e",
    "card-foreground": "#f5f5f7",
    primary: "#f4f4f5",
    "primary-foreground": "#121212",
    secondary: "#2c2c2e",
    "secondary-foreground": "#f5f5f7",
    muted: "#2c2c2e",
    "muted-foreground": "#98989f",
    accent: "#2e2e2e",
    "accent-foreground": "#f5f5f7",
    destructive: "#fc7a73",
    "destructive-foreground": "#15151d",
    border: "rgba(255, 255, 255, 0.09)",
    input: "#6c6c70",
    fill: "rgba(255, 255, 255, 0.07)",
    "fill-2": "rgba(255, 255, 255, 0.12)",
    "fill-3": "rgba(255, 255, 255, 0.18)",
    scrim: "rgba(0, 0, 0, 0.5)",
  },
};

/**
 * UIKit semantic colours per token. Tokens without one (text on a filled
 * accent, the scrim) keep the palette value on iOS too.
 *
 * `muted-foreground` and `destructive` are left out on purpose: they are used
 * as text, and in light mode `secondaryLabel` (3.4:1 on white, 3.1:1 on
 * `secondarySystemBackground`) and `systemRed` (3.6:1 on white, 3.2:1 on
 * `secondarySystemBackground`; 3.5:1 under `destructive-foreground`) miss
 * WCAG AA's 4.5:1. The palette values pass in both schemes, at the price of
 * not adapting to Increase Contrast.
 */
export const iosSystemColors: Partial<Record<ColorToken, string>> = {
  background: "systemBackground",
  foreground: "label",
  card: "secondarySystemBackground",
  "card-foreground": "label",
  primary: "label",
  "primary-foreground": "systemBackground",
  secondary: "secondarySystemFill",
  "secondary-foreground": "label",
  muted: "tertiarySystemFill",
  accent: "systemFill",
  "accent-foreground": "label",
  border: "separator",
  input: "systemGray2",
  fill: "quaternarySystemFill",
  "fill-2": "tertiarySystemFill",
  "fill-3": "secondarySystemFill",
};

/**
 * Material 3 colour roles per token, resolved on Android 12+ from the
 * wallpaper (`Color.android.dynamic`, the source the navigation chrome reads
 * in `navigation-theme`) by `android-colors` and `DynamicColorRoot`. Below Android 12 the palette
 * above applies. `fill*` and `scrim` stay alpha values on both.
 */
export const androidDynamicColors: Partial<Record<ColorToken, M3Role>> = {
  background: "surface",
  foreground: "onSurface",
  card: "surfaceContainerHigh",
  "card-foreground": "onSurface",
  primary: "primary",
  "primary-foreground": "onPrimary",
  secondary: "secondaryContainer",
  "secondary-foreground": "onSecondaryContainer",
  muted: "surfaceContainerHighest",
  "muted-foreground": "onSurfaceVariant",
  accent: "secondaryContainer",
  "accent-foreground": "onSecondaryContainer",
  destructive: "error",
  "destructive-foreground": "onError",
  border: "outlineVariant",
  input: "outline",
};

/** The 4pt spacing steps, Tailwind `*-1` (4) to `*-12` (48). Screens use no others. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** iOS's lift under artwork (Material is flat): a black shadow at this opacity. */
export const artShadow = { color: "#000000", opacity: 0.18 } as const;

/** A centred message's longest line (empty and error states). */
export const measure = 300;

/** Tailwind spacing keys of the `space` steps (`gap-3` is `space.md`). */
export const spaceClasses = {
  1: space.xs,
  2: space.sm,
  3: space.md,
  4: space.lg,
  6: space.xl,
  8: space.xxl,
  12: space.xxxl,
} as const;

type RadiusScale = Record<"xs" | "sm" | "md" | "lg" | "xl", number>;

/**
 * Corner radii in points; `rounded-full` (capsules, round art) comes with
 * Tailwind. Android takes Material 3 Expressive's shape scale (extra-small 4,
 * small 8, medium 12, large 16, extra-large 28). Tailwind's defaults are
 * iOS's; `ThemeRoot` sets this platform's at runtime.
 */
export const radii: RadiusScale =
  process.env.EXPO_OS === "android"
    ? { xs: 4, sm: 8, md: 12, lg: 16, xl: 28 }
    : { xs: 4, sm: 6, md: 10, lg: 16, xl: 24 };

export type Radius = keyof typeof radii | "full";

/** Corner styles: a multiplier on `radii` (the web's corner roundness setting). */
export const CORNER_STYLES = {
  sharp: 0.35,
  default: 1,
  round: 1.6,
} as const;

export type CornerStyle = keyof typeof CORNER_STYLES;

/** `radii` scaled for a corner style. */
export function scaledRadii(
  style: CornerStyle,
): Record<keyof typeof radii, number> {
  const scale = CORNER_STYLES[style];
  return Object.fromEntries(
    Object.entries(radii).map(([name, value]) => [
      name,
      Math.round(value * scale),
    ]),
  ) as Record<keyof typeof radii, number>;
}

/**
 * Accent presets: the colour of `primary` (filled buttons, the selected chip,
 * the tab bar tint) and its text. `default` keeps the neutral palette.
 */
export const ACCENTS = {
  default: undefined,
  blue: { light: "#0a63d8", dark: "#5aa9ff" },
  indigo: { light: "#4f46e5", dark: "#8b8cff" },
  purple: { light: "#8e3fd1", dark: "#c08bff" },
  pink: { light: "#cc2962", dark: "#ff7aa8" },
  red: { light: "#d22727", dark: "#ff7a72" },
  orange: { light: "#b14f0b", dark: "#ffa24d" },
  green: { light: "#1c7b44", dark: "#4ad58a" },
  teal: { light: "#0d7a7a", dark: "#4fd1c9" },
} as const satisfies Record<
  string,
  { light: string; dark: string } | undefined
>;

export type AccentId = keyof typeof ACCENTS;

export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];

/** The `primary` and `primary-foreground` colours of an accent, or undefined for the default. */
export function accentColors(
  accent: AccentId,
  scheme: ColorScheme,
): { primary: string; foreground: string } | undefined {
  const preset = ACCENTS[accent];
  if (!preset) return undefined;
  return {
    primary: preset[scheme],
    foreground: scheme === "dark" ? "#101010" : "#ffffff",
  };
}

/** Tokens an accent replaces. */
export const ACCENT_TOKENS = ["primary", "primary-foreground"] as const;

/** Artwork edges in points, one per context (`Artwork size`). */
export const art = {
  row: 48,
  mini: 36,
  pick: 48,
  tile: 56,
  avatar: 48,
  card: 136,
  /** The Top Result card's art (Android search). */
  feature: 96,
  header: 200,
  hero: 208,
} as const;

/** `player` is Now Playing's art, sized from the window (`playerArtSize`). */
export type ArtSize = keyof typeof art | "player";

/** Now Playing's artwork edge: the window less its 24pt gutters, at most 360. */
export function playerArtSize(windowWidth: number): number {
  return Math.min(windowWidth - 2 * space.xl, 360);
}

/** Artwork radius per size. Round types (artists, stations) are `full` at every size. */
export const artRadius: Record<ArtSize, Radius> = {
  row: "sm",
  mini: "sm",
  pick: "sm",
  tile: "sm",
  avatar: "full",
  card: "md",
  feature: "md",
  header: "lg",
  hero: "lg",
  player: "lg",
};

/**
 * Control, row and gutter sizes in points: the web's touch-screen
 * (`pointer: coarse`) values, plus `touch`, the smallest size of anything the
 * listener taps alone (an icon button, a menu trigger, a button): Android's
 * 48dp, which also clears iOS's 44pt. `ctl` is the visual height of a control
 * that reaches it with hit slop or sits in a row of its own.
 * `row` is a list row's minimum (it grows with Dynamic Type), `dock` the
 * floating mini player's height.
 */
export const sizes = {
  ctl: 40,
  touch: 48,
  row: 56,
  /** A two-line list row (Material's list item with supporting text). */
  "row-2": 72,
  page: 16,
  dock: 64,
  /** The seam between the tiles of an Android segmented list or connected button group. */
  seam: 2,
  /**
   * The widest a column of text and controls gets (entity headers, forms,
   * settings), centred on a tablet or in landscape (`max-w-readable`). A phone
   * in portrait is narrower, so it never applies there.
   */
  readable: 672,
} as const;

/**
 * Tailwind's whole spacing scale in points (`tailwind.config.ts` sets it as
 * `theme.spacing`, not an extension, plus `full`): `0`, `px`, the seven
 * `space` steps and the named `sizes` (`px-page`, `min-h-row`, `size-touch`).
 * A class off it (a half step, a 5 or a 10) compiles to nothing, which NativeWind
 * drops silently; `spacing.test.ts` fails on one instead.
 */
export const spacingScale = {
  0: 0,
  px: 1,
  ...spaceClasses,
  ...sizes,
} as const;

/** Symbol sizes in points (`Icon size="md"`); no others. */
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type IconSize = keyof typeof iconSize;

/** Font scale caps: only fixed-height chrome (the mini player) caps its text. */
export const maxFontScale = { chrome: 1.3 } as const;

/** The type ramp's roles (spec 2.2). */
export type TextVariant =
  | "largeTitle"
  | "title1"
  | "title2"
  | "headline"
  | "body"
  | "label"
  | "subhead"
  | "footnote"
  | "caption";

export type TypeStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700";
};

type Weight = TypeStyle["fontWeight"];

type Scale = Record<TextVariant, TypeStyle>;

/** Dynamic Type's default sizes per text style. */
const iosScale: Scale = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  body: { fontSize: 17, lineHeight: 22, fontWeight: "400" },
  label: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
};

/**
 * The Material 3 type scale: headlineMedium, headlineSmall, titleLarge,
 * titleMedium, bodyLarge, labelLarge, bodyMedium (subhead and footnote),
 * labelMedium. `title2` is titleLarge at its full 22/28, as iOS's Title 2.
 */
const androidScale: Scale = {
  largeTitle: { fontSize: 28, lineHeight: 36, fontWeight: "400" },
  title1: { fontSize: 24, lineHeight: 32, fontWeight: "400" },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "500" },
  headline: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  subhead: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  footnote: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
};

/**
 * Material 3 Expressive's emphasized styles: the same sizes a weight up, for
 * hierarchy (section and entity titles, the playing title, a selected chip).
 * iOS has none (`Text emphasized` is a no-op there).
 */
export const emphasizedWeights: Partial<Record<TextVariant, Weight>> =
  process.env.EXPO_OS === "android"
    ? {
        largeTitle: "500",
        title1: "500",
        title2: "700",
        headline: "700",
        body: "500",
        label: "700",
        subhead: "500",
        footnote: "500",
        caption: "700",
      }
    : {};

/**
 * One semantic type scale, sized per platform. Both scale with the user's
 * font size setting; no custom fonts.
 */
export const typeScale: Record<"ios" | "android", Scale> = {
  ios: iosScale,
  android: androidScale,
};

/**
 * This platform's scale, for `Text` and for native `@expo/ui` text (which
 * takes sizes, not classes). `EXPO_OS` is inlined at build time, so this
 * module still needs no React Native import.
 */
export const textStyles: Record<TextVariant, TypeStyle> =
  process.env.EXPO_OS === "ios" ? typeScale.ios : typeScale.android;
