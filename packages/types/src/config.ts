/** Interface fonts. `system` is Inter with the platform stack as fallback. */
export const FONT_IDS = [
  "system",
  "rounded",
  "grotesk",
  "serif",
  "mono",
] as const;
export type FontId = (typeof FONT_IDS)[number];

/** Heading fonts: every interface font plus the Cal Sans display face (the default). */
export const HEADING_FONT_IDS = ["display", ...FONT_IDS] as const;
export type HeadingFontId = (typeof HEADING_FONT_IDS)[number];

/** Root text size in px; 16 is the browser default. */
export const TEXT_SIZES = [15, 16, 17, 18] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const DENSITIES = ["comfortable", "compact"] as const;
export type Density = (typeof DENSITIES)[number];

export const GLASS_LEVELS = ["liquid", "subtle", "solid"] as const;
export type GlassLevel = (typeof GLASS_LEVELS)[number];

/** Radius presets in rem; `0.75` is the default. Any value up to `RADIUS_MAX_REM` is valid. */
export const RADIUS_PRESETS = [0, 0.3, 0.5, 0.75, 1] as const;
export const RADIUS_MAX_REM = 1.5;

export type ThemeConfig = {
  /** A preset name from `config/themes.ts` or a custom `#rrggbb` hex. */
  accent: string;
  /** Base corner radius in rem, 0 to `RADIUS_MAX_REM` (0 to 24px). */
  radius: number;
  font: FontId;
  headingFont: HeadingFontId;
  textSize: TextSize;
  density: Density;
  glass: GlassLevel;
  /** Tint the background with the playing song's artwork. */
  ambient: boolean;
  /** Replace springs and slides with simple fades, on top of the OS setting. */
  reduceMotion: boolean;
};
