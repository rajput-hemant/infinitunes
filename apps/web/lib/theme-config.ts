import {
  DENSITIES,
  FONT_IDS,
  GLASS_LEVELS,
  HEADING_FONT_IDS,
  RADIUS_MAX_REM,
  TEXT_SIZES,
} from "@infinitunes/types";
import type { ThemeConfig } from "@infinitunes/types";

import { DEFAULT_ACCENT, themes } from "~/config/themes";
import { normalizeHex } from "~/lib/theme/oklch";

export const THEME_COOKIE = "theme-config";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_THEME_CONFIG: Readonly<ThemeConfig> = Object.freeze({
  accent: DEFAULT_ACCENT,
  radius: 0.75,
  font: "system",
  headingFont: "display",
  textSize: 16,
  density: "comfortable",
  glass: "liquid",
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
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(config).filter(([key, value]) => value !== defaults[key]),
    ),
  );
}

export function isDefaultThemeConfig(config: ThemeConfig): boolean {
  return serializeThemeConfig(config) === "{}";
}
