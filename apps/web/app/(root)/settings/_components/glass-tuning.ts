import type { GlassTuning } from "@infinitunes/types";

import { DEFAULT_GLASS_TUNING } from "~/lib/theme-config";

/** Tint alpha while the config leaves `tint` null: the stylesheet default per scheme (`--glass-tint` in `styles/glass.css`). */
const DEFAULT_TINT = { light: 0.14, dark: 0.24 } as const;

type GlassSliderKey =
  | "tint"
  | "blur"
  | "refraction"
  | "sat"
  | "spec"
  | "shadow"
  | "ambientLevel";

/** The stored tuning with the scheme's default tint filled in, so every slider reads a number. */
type ResolvedGlassTuning = Omit<GlassTuning, "tint"> & { tint: number };

export function resolveGlassTuning(
  tuning: GlassTuning,
  dark: boolean,
): ResolvedGlassTuning {
  return {
    ...tuning,
    tint: tuning.tint ?? DEFAULT_TINT[dark ? "dark" : "light"],
  };
}

type GlassSlider = {
  key: GlassSliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "px" | "percent";
  /** The slider shows the complement of the stored value (tint alpha becomes transparency). */
  inverted?: boolean;
};

export const GLASS_SLIDERS: readonly GlassSlider[] = [
  {
    key: "tint",
    label: "Transparency",
    min: 0.1,
    max: 1,
    step: 0.01,
    unit: "percent",
    inverted: true,
  },
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "px" },
  {
    key: "refraction",
    label: "Refraction",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
  },
  {
    key: "sat",
    label: "Saturation",
    min: 1,
    max: 2.6,
    step: 0.05,
    unit: "percent",
  },
  {
    key: "spec",
    label: "Edge highlight",
    min: 0,
    max: 1.6,
    step: 0.05,
    unit: "percent",
  },
  {
    key: "shadow",
    label: "Shadow",
    min: 0,
    max: 1.6,
    step: 0.05,
    unit: "percent",
  },
  {
    key: "ambientLevel",
    label: "Ambient intensity",
    min: 0,
    max: 1,
    step: 0.01,
    unit: "percent",
  },
];

const round = (value: number) => Math.round(value * 100) / 100;

export function sliderValue(slider: GlassSlider, tuning: ResolvedGlassTuning) {
  const stored = tuning[slider.key];
  return slider.inverted ? round(1 - stored) : stored;
}

export function sliderPatch(
  slider: GlassSlider,
  shown: number,
): Partial<GlassTuning> {
  return { [slider.key]: slider.inverted ? round(1 - shown) : shown };
}

export function formatSliderValue(slider: GlassSlider, shown: number) {
  return slider.unit === "px" ? `${shown}px` : `${Math.round(shown * 100)}%`;
}

export function isDefaultGlassTuning(tuning: GlassTuning): boolean {
  const d = DEFAULT_GLASS_TUNING;
  return (
    tuning.variant === d.variant &&
    tuning.tint === d.tint &&
    tuning.blur === d.blur &&
    tuning.refraction === d.refraction &&
    tuning.sat === d.sat &&
    tuning.spec === d.spec &&
    tuning.shadow === d.shadow &&
    tuning.ambientLevel === d.ambientLevel &&
    tuning.accentTint === d.accentTint
  );
}
