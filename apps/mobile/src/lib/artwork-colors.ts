import type { ImageColorsResult } from "react-native-image-colors";

import type { ColorScheme } from "~/theme/tokens";

/** Colours for content laid on one surface: text, secondary text and accents. */
export type OnSurfaceColors = {
  /** Titles and default icons. */
  foreground: string;
  /** Subtitles, times and toggles that are off. */
  muted: string;
  /** The liked heart, the played part of the scrubber. */
  accent: string;
};

/**
 * The player's D3 "Ambient Tonal" colours, derived from the current
 * artwork. Every pair here passed `meetsContrast` when it was built.
 */
export type PlayerColors = OnSurfaceColors & {
  scheme: ColorScheme;
  /** Now Playing's wash, top to bottom. */
  wash: readonly [string, string];
  /** The play/pause shape and its glyph. */
  control: string;
  onControl: string;
  /**
   * The scrubber's unplayed track where the platform slider takes one, 3:1
   * against the wash's bottom stop (the end the scrubber sits nearer).
   */
  track: string;
  /** The floating dock (Android): an opaque M3 tonal surface. */
  dock: OnSurfaceColors & { background: string };
};

export type WashPlatform = "ios" | "android";

/** WCAG 2 minimums: body text, and controls or other non-text marks. */
export const MIN_TEXT_CONTRAST = 4.5;
export const MIN_CONTROL_CONTRAST = 3;

const HEX = /^#[\da-f]{6}$/i;

type MaterialColors = typeof import("@material/material-color-utilities");

let material: MaterialColors | null = null;

/**
 * The colour library (Material's scheme maths, a large module), evaluated on
 * first use instead of at import time: Metro inlines requires, so nothing runs
 * until this is called. `loadMaterialColors` calls it from the first
 * extraction's query, so the cost lands there and not at launch or in a
 * render. (A native bundle is one file, so `import()` would not split it
 * either, and Jest has no dynamic import without a VM flag.)
 */
function materialColors(): MaterialColors {
  material ??= require("@material/material-color-utilities") as MaterialColors;
  return material;
}

/** Evaluates the colour library ahead of the first `playerColorsFromSeed`. */
export async function loadMaterialColors(): Promise<void> {
  materialColors();
}

/**
 * The `fallback` handed to the extractor, which answers it in every field it
 * finds no swatch for. Its default (`#000000`) is a real colour that would
 * seed a grey wash; this one reads as "no colour" instead.
 */
export const NO_SWATCH = "#010203";

function channels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function linear(channel: number): number {
  const unit = channel / 255;
  return unit <= 0.040_45 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an opaque `#rrggbb` colour. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map(linear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio of two opaque `#rrggbb` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** `a` blended towards `b` by `amount` (0 to 1) in sRGB, as a gradient draws it. */
export function mix(a: string, b: string, amount: number): string {
  const from = channels(a);
  const to = channels(b);
  const blended = from.map((value, index) =>
    Math.round(value + ((to[index] ?? value) - value) * amount),
  );
  return `#${blended.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** Every pair the player draws, with the contrast it needs. */
function contrastPairs(colors: PlayerColors) {
  const [top, bottom] = colors.wash;
  const washStops = [top, mix(top, bottom, 0.5), bottom];
  const pairs: [string, string, number][] = [
    [colors.track, bottom, MIN_CONTROL_CONTRAST],
  ];
  for (const stop of washStops) {
    pairs.push(
      [colors.foreground, stop, MIN_TEXT_CONTRAST],
      [colors.muted, stop, MIN_TEXT_CONTRAST],
      [colors.accent, stop, MIN_CONTROL_CONTRAST],
      [colors.control, stop, MIN_CONTROL_CONTRAST],
    );
  }
  const { dock } = colors;
  pairs.push(
    [colors.onControl, colors.control, MIN_TEXT_CONTRAST],
    [dock.foreground, dock.background, MIN_TEXT_CONTRAST],
    [dock.muted, dock.background, MIN_TEXT_CONTRAST],
    [dock.accent, dock.background, MIN_CONTROL_CONTRAST],
  );
  return pairs;
}

/**
 * Whether every text pair reaches 4.5:1 and every control 3:1, checked at
 * both ends and the middle of the wash. Malformed colours fail.
 */
export function meetsContrast(colors: PlayerColors): boolean {
  return contrastPairs(colors).every(
    ([foreground, background, minimum]) =>
      HEX.test(foreground) &&
      HEX.test(background) &&
      contrastRatio(foreground, background) >= minimum,
  );
}

/** The colour built so far, or `null` when it misses a contrast minimum. */
function checked(colors: PlayerColors): PlayerColors | null {
  return meetsContrast(colors) ? colors : null;
}

/**
 * The player's colours for one artwork seed, or `null` (use the D1 palette)
 * when the seed is not a colour or a pair misses its contrast minimum.
 *
 * Material's content scheme keeps the artwork's hue and chroma (fidelity)
 * and fixes the tones, so the result follows the app's colour scheme: a
 * deep wash in dark mode, a pale one in light mode.
 *
 * - iOS: the wash runs down the artwork's own tonal palette (tone 30 to 10 in
 *   dark, 90 to 98 in light), with text from the same hue; accents are the
 *   foreground, as the UIKit `label` accent of the D1 palette is.
 * - Android: Material 3 roles seeded from the artwork (secondary container to
 *   surface, primary for accents and the play shape), the dock on surface
 *   container high.
 */
export function playerColorsFromSeed(
  seed: string,
  scheme: ColorScheme,
  platform: WashPlatform,
): PlayerColors | null {
  if (!HEX.test(seed)) return null;
  const { argbFromHex, Hct, hexFromArgb, SchemeContent } = materialColors();
  const dark = scheme === "dark";
  const m3 = new SchemeContent(Hct.fromInt(argbFromHex(seed)), dark, 0);
  const hex = hexFromArgb;
  const tone = (value: number) => hex(m3.primaryPalette.tone(value));
  const dock = {
    background: hex(m3.surfaceContainerHigh),
    foreground: hex(m3.onSurface),
    muted: hex(m3.onSurfaceVariant),
    accent: hex(m3.primary),
  };

  if (platform === "ios") {
    const foreground = tone(dark ? 95 : 10);
    return checked({
      scheme,
      wash: dark ? [tone(30), tone(10)] : [tone(90), tone(98)],
      foreground,
      muted: tone(dark ? 80 : 30),
      accent: foreground,
      control: foreground,
      onControl: tone(dark ? 20 : 95),
      track: tone(50),
      dock,
    });
  }

  return checked({
    scheme,
    wash: [hex(m3.secondaryPalette.tone(dark ? 30 : 90)), hex(m3.surface)],
    foreground: hex(m3.onSurface),
    muted: hex(m3.onSurfaceVariant),
    accent: hex(m3.primary),
    control: hex(m3.primary),
    onControl: hex(m3.onPrimary),
    track: hex(m3.outline),
    dock,
  });
}

/**
 * The colour that stands for an artwork: UIImageColors' background on iOS
 * (the colour the cover is mostly made of), Palette's dominant swatch on
 * Android. `null` when the extractor answered nothing usable (empty or
 * malformed fields, or `NO_SWATCH`).
 */
export function seedFromImageColors(result: ImageColorsResult): string | null {
  const candidates =
    result.platform === "ios"
      ? [result.background, result.primary]
      : [result.dominant, result.vibrant];
  return (
    candidates.find(
      (color) =>
        color !== undefined &&
        HEX.test(color) &&
        color.toLowerCase() !== NO_SWATCH,
    ) ?? null
  );
}
