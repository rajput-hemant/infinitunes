import type { GlassTuning } from "@infinitunes/types";

import { normalizeHex } from "~/lib/theme/oklch";

type NumericKey = Exclude<keyof GlassTuning, "tintColor">;

export type GlassRange = {
  min: number;
  max: number;
  step: number;
};

/** The lens controls' ranges. `chroma` fringes red against cyan; the others shape the rim. */
export const GLASS_RANGES: Readonly<Record<NumericKey, GlassRange>> = {
  depth: { min: 0, max: 120, step: 1 },
  splay: { min: 2, max: 40, step: 1 },
  feather: { min: 0, max: 40, step: 1 },
  curve: { min: 0.3, max: 3, step: 0.1 },
  blur: { min: 0, max: 5, step: 0.01 },
  chroma: { min: 0, max: 0.25, step: 0.01 },
  glint: { min: 0, max: 150, step: 5 },
  tint: { min: 0, max: 1, step: 0.01 },
};

export const DEFAULT_GLASS_TUNING: Readonly<GlassTuning> = Object.freeze({
  depth: 60,
  splay: 2,
  feather: 24,
  curve: 2,
  blur: 2,
  chroma: 0,
  glint: 25,
  tint: 0,
  tintColor: "#ffffff",
});

export const GLASS_PRESET_IDS = [
  "simple",
  "thick",
  "frosted",
  "cut",
  "plexi",
] as const;
export type GlassPresetId = (typeof GLASS_PRESET_IDS)[number];

export const GLASS_PRESETS: Readonly<
  Record<GlassPresetId, { label: string; tuning: Readonly<GlassTuning> }>
> = {
  simple: { label: "Simple", tuning: DEFAULT_GLASS_TUNING },
  thick: {
    label: "Thick",
    tuning: {
      ...DEFAULT_GLASS_TUNING,
      depth: 120,
      feather: 30,
      curve: 3,
      glint: 60,
    },
  },
  frosted: {
    label: "Frosted",
    tuning: {
      ...DEFAULT_GLASS_TUNING,
      depth: 120,
      splay: 16,
      feather: 26,
      curve: 2.6,
      blur: 5,
      glint: 20,
    },
  },
  cut: {
    label: "Cut",
    tuning: {
      ...DEFAULT_GLASS_TUNING,
      depth: 120,
      splay: 40,
      feather: 40,
      curve: 0.6,
      blur: 0.05,
      glint: 15,
    },
  },
  plexi: {
    label: "Orange plexiglass",
    tuning: {
      ...DEFAULT_GLASS_TUNING,
      depth: 60,
      splay: 4,
      feather: 10,
      curve: 1.2,
      blur: 2.5,
      glint: 25,
      tint: 0.94,
      tintColor: "#ff6600",
    },
  },
};

/** The preset a tuning equals exactly, if any. */
export function matchingPreset(tuning: GlassTuning): GlassPresetId | null {
  return (
    GLASS_PRESET_IDS.find((id) =>
      sameTuning(GLASS_PRESETS[id].tuning, tuning),
    ) ?? null
  );
}

export function sameTuning(a: GlassTuning, b: GlassTuning): boolean {
  return (
    a.depth === b.depth &&
    a.splay === b.splay &&
    a.feather === b.feather &&
    a.curve === b.curve &&
    a.blur === b.blur &&
    a.chroma === b.chroma &&
    a.glint === b.glint &&
    a.tint === b.tint &&
    a.tintColor === b.tintColor
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: unknown, key: NumericKey): number {
  const { min, max } = GLASS_RANGES[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_GLASS_TUNING[key];
  }
  return Math.round(Math.max(min, Math.min(max, value)) * 1000) / 1000;
}

/**
 * Coerces untrusted input into a valid tuning. Each field falls back to its
 * default on its own, so a cookie written by an older model (`refraction`,
 * `sat`, a `null` tint, ...) keeps whatever still applies and never throws.
 */
export function normalizeGlassTuning(value: unknown): GlassTuning {
  if (!isRecord(value)) return DEFAULT_GLASS_TUNING;
  return {
    depth: clamp(value.depth, "depth"),
    splay: clamp(value.splay, "splay"),
    feather: clamp(value.feather, "feather"),
    curve: clamp(value.curve, "curve"),
    blur: clamp(value.blur, "blur"),
    chroma: clamp(value.chroma, "chroma"),
    glint: clamp(value.glint, "glint"),
    tint: clamp(value.tint, "tint"),
    tintColor:
      (typeof value.tintColor === "string"
        ? normalizeHex(value.tintColor)
        : null) ?? DEFAULT_GLASS_TUNING.tintColor,
  };
}

/** The custom properties a tuning writes (`themeConfigToHtml` writes the same for the page). */
export type GlassVars = Record<`--glass-${string}`, string>;

/**
 * The paint half of a tuning as inline custom properties, for a surface that
 * carries its own preset. The lens half (depth, rim shape, chroma) is read from
 * the preset by the registry, not from CSS.
 */
export function glassPaintVars(tuning: GlassTuning): GlassVars {
  return {
    "--glass-blur": `${tuning.blur}px`,
    "--glass-glint": String(tuning.glint / 100),
    "--glass-tint": String(tuning.tint),
    "--glass-tint-c": tuning.tintColor,
  };
}
