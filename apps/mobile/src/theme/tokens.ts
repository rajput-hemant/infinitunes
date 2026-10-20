/**
 * Semantic design tokens. Screens style with the token names (`bg-background`,
 * `text-muted-foreground`, `rounded-md`, `h-row`), never with a platform's
 * own colours, so they stay platform-agnostic while each platform keeps its
 * native look:
 *
 * - iOS resolves colours to UIKit system colours (`iosSystemColors`), which
 *   follow light/dark mode, contrast settings and Liquid Glass by themselves.
 * - Android resolves them to the neutral palette below, the web theme's
 *   (`apps/web/styles/globals.css`) converted to hex, as the native colour
 *   parser has no `oklch()`.
 *
 * Navigation chrome does not use these: it takes system colours on iOS and
 * Material You dynamic colours on Android (`navigation-theme`), read in
 * components through `useTheme().colors`.
 *
 * Tailwind (`tailwind.config.ts`) and the app config load this module in
 * Node, so it must not import React Native.
 */

export type ColorScheme = "light" | "dark";

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
  "muted-foreground": "secondaryLabel",
  accent: "systemFill",
  "accent-foreground": "label",
  destructive: "systemRed",
  border: "separator",
  input: "systemGray2",
  fill: "quaternarySystemFill",
  "fill-2": "tertiarySystemFill",
  "fill-3": "secondarySystemFill",
};

/**
 * Corner radii in points, derived from the web's 12px `--radius` base:
 * `sm` 0.66x, `md` 1x, `lg` 1.5x, `xl` 2x.
 */
export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
} as const;

/**
 * Control, row and gutter sizes in points: the web's touch-screen
 * (`pointer: coarse`) values, which also clear both platforms' 44pt/48dp
 * minimum touch targets with hit slop.
 */
export const sizes = {
  ctl: 40,
  "ctl-lg": 44,
  row: 56,
  art: 44,
  page: 16,
} as const;

export type TextVariant =
  | "largeTitle"
  | "title"
  | "headline"
  | "body"
  | "subhead"
  | "caption";

type TypeStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: "400" | "500" | "600" | "700";
};

/**
 * One semantic type scale, sized per platform: Apple's Dynamic Type defaults
 * on iOS, the Material 3 type scale on Android. Both scale with the user's
 * font size setting.
 */
export const typeScale: Record<
  "ios" | "android",
  Record<TextVariant, TypeStyle>
> = {
  ios: {
    largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" },
    title: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
    headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" },
    body: { fontSize: 17, lineHeight: 22, fontWeight: "400" },
    subhead: { fontSize: 15, lineHeight: 20, fontWeight: "400" },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
  },
  android: {
    largeTitle: { fontSize: 32, lineHeight: 40, fontWeight: "400" },
    title: { fontSize: 22, lineHeight: 28, fontWeight: "400" },
    headline: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
    body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
    subhead: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  },
};
