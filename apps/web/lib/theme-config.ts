import {
  DENSITIES,
  FONT_IDS,
  GLASS_LEVELS,
  GLASS_VARIANTS,
  HEADING_FONT_IDS,
  RADIUS_MAX_REM,
  TEXT_SIZES,
} from "@infinitunes/types";
import type { ThemeConfig, GlassTuning } from "@infinitunes/types";

import { DEFAULT_ACCENT, themes } from "~/config/themes";
import { normalizeHex } from "~/lib/theme/oklch";

export const THEME_COOKIE = "theme-config";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_GLASS_TUNING: Readonly<GlassTuning> = Object.freeze({
  variant: "regular",
  tint: null,
  blur: 3,
  refraction: 30,
  sat: 1.8,
  spec: 1,
  shadow: 1,
  ambientLevel: 0.62,
  accentTint: false,
});

export const DEFAULT_THEME_CONFIG: Readonly<ThemeConfig> = Object.freeze({
  accent: DEFAULT_ACCENT,
  radius: 0.75,
  font: "system",
  headingFont: "display",
  textSize: 16,
  density: "comfortable",
  glass: "liquid",
  glassTuning: DEFAULT_GLASS_TUNING,
  ambient: true,
  reduceMotion: false,
});

function oneOf<T>(options: readonly T[], value: unknown, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

function toAccent(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_THEME_CONFIG.accent;
  const name = value.trim().toLowerCase();
  const preset = themes.find((theme) => theme.name === name);
  return preset?.name ?? normalizeHex(name) ?? DEFAULT_THEME_CONFIG.accent;
}

function toRadius(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_THEME_CONFIG.radius;
  }
  if (value < 0 || value > RADIUS_MAX_REM) return DEFAULT_THEME_CONFIG.radius;
  return Math.round(value * 10_000) / 10_000;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function clampTint(v: unknown): number | null {
  if (v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0.1, Math.min(1, v));
}

function toGlassTuning(value: unknown): GlassTuning {
  if (!isRecord(value)) return DEFAULT_GLASS_TUNING;
  return {
    variant: oneOf(GLASS_VARIANTS, value.variant, DEFAULT_GLASS_TUNING.variant),
    tint: clampTint(value.tint),
    blur: clamp(value.blur, 0, 20, DEFAULT_GLASS_TUNING.blur),
    refraction: clamp(value.refraction, 0, 48, DEFAULT_GLASS_TUNING.refraction),
    sat: clamp(value.sat, 1, 2.6, DEFAULT_GLASS_TUNING.sat),
    spec: clamp(value.spec, 0, 1.6, DEFAULT_GLASS_TUNING.spec),
    shadow: clamp(value.shadow, 0, 1.6, DEFAULT_GLASS_TUNING.shadow),
    ambientLevel: clamp(
      value.ambientLevel,
      0,
      1,
      DEFAULT_GLASS_TUNING.ambientLevel,
    ),
    accentTint: toBoolean(value.accentTint, DEFAULT_GLASS_TUNING.accentTint),
  };
}

/**
 * Coerces untrusted input (the cookie, a server action argument) into a valid
 * config. Each field falls back to its default on its own, and nothing throws.
 * Cookies written before the customizer stored the accent preset as `theme`;
 * that key is still honored when `accent` is absent.
 */
export function normalizeThemeConfig(value: unknown): ThemeConfig {
  if (!isRecord(value)) return DEFAULT_THEME_CONFIG;
  const field = (key: string): unknown =>
    Object.hasOwn(value, key) ? value[key] : undefined;

  return {
    accent: toAccent(field("accent") ?? field("theme")),
    radius: toRadius(field("radius")),
    font: oneOf(FONT_IDS, field("font"), DEFAULT_THEME_CONFIG.font),
    headingFont: oneOf(
      HEADING_FONT_IDS,
      field("headingFont"),
      DEFAULT_THEME_CONFIG.headingFont,
    ),
    textSize: oneOf(
      TEXT_SIZES,
      field("textSize"),
      DEFAULT_THEME_CONFIG.textSize,
    ),
    density: oneOf(DENSITIES, field("density"), DEFAULT_THEME_CONFIG.density),
    glass: oneOf(GLASS_LEVELS, field("glass"), DEFAULT_THEME_CONFIG.glass),
    glassTuning: toGlassTuning(
      field("glassTuning") ?? field("glass_tuning") ?? {},
    ),
    ambient: toBoolean(field("ambient"), DEFAULT_THEME_CONFIG.ambient),
    reduceMotion: toBoolean(
      field("reduceMotion"),
      DEFAULT_THEME_CONFIG.reduceMotion,
    ),
  };
}

/** Parses the user-controlled `theme-config` cookie; malformed input yields the defaults. */
export function parseThemeConfig(raw: string | undefined): ThemeConfig {
  if (!raw) return DEFAULT_THEME_CONFIG;
  try {
    return normalizeThemeConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

/** Serializes only the fields that differ from the defaults, so a default config is `{}`. */
export function serializeThemeConfig(config: ThemeConfig): string {
  const defaults: Record<string, unknown> = { ...DEFAULT_THEME_CONFIG };
  const entries = Object.entries(config).filter(([key, value]) => {
    if (key === "glassTuning") {
      const gDefaults = DEFAULT_GLASS_TUNING as Record<string, unknown>;
      const gValue = value as Record<string, unknown>;
      return Object.keys(gValue).some((gk) => gValue[gk] !== gDefaults[gk]);
    }
    return value !== defaults[key];
  });

  const obj: Record<string, unknown> = Object.fromEntries(entries);
  if (obj.glassTuning) {
    const gDefaults = DEFAULT_GLASS_TUNING as Record<string, unknown>;
    const gValue = obj.glassTuning as Record<string, unknown>;
    const gDiff = Object.entries(gValue).filter(
      ([gk, gv]) => gv !== gDefaults[gk],
    );
    if (gDiff.length > 0) {
      obj.glassTuning = Object.fromEntries(gDiff);
    } else {
      delete obj.glassTuning;
    }
  }
  return JSON.stringify(obj);
}

export function isDefaultThemeConfig(config: ThemeConfig): boolean {
  return serializeThemeConfig(config) === "{}";
}
