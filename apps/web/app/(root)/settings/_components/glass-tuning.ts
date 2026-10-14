import type { GlassTuning } from "@infinitunes/types";

import {
  DEFAULT_GLASS_TUNING,
  GLASS_RANGES,
  sameTuning,
} from "~/lib/glass/tuning";

type GlassSliderKey = Exclude<keyof GlassTuning, "tintColor">;

type GlassSlider = {
  key: GlassSliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Digits after the point when the value is shown. */
  decimals: number;
  help: string;
};

const SLIDERS: readonly Pick<
  GlassSlider,
  "key" | "label" | "decimals" | "help"
>[] = [
  {
    key: "depth",
    label: "Depth",
    decimals: 0,
    help: "How far the rim bends what is behind it.",
  },
  {
    key: "splay",
    label: "Splay",
    decimals: 0,
    help: "Width of the bending rim.",
  },
  {
    key: "feather",
    label: "Feather",
    decimals: 0,
    help: "How softly the rim fades inward.",
  },
  {
    key: "curve",
    label: "Curvature",
    decimals: 1,
    help: "Wide bevel below 1, sharp edge above.",
  },
  { key: "blur", label: "Blur", decimals: 2, help: "Frost the glass." },
  {
    key: "chroma",
    label: "Chromatic",
    decimals: 2,
    help: "Red and cyan fringing on the rim.",
  },
  {
    key: "glint",
    label: "Glint",
    decimals: 0,
    help: "Edge highlight strength.",
  },
  {
    key: "tint",
    label: "Tint",
    decimals: 2,
    help: "Colour layer over the glass; it also becomes the app's primary colour.",
  },
];

export const GLASS_SLIDERS: readonly GlassSlider[] = SLIDERS.map((slider) => ({
  ...slider,
  ...GLASS_RANGES[slider.key],
}));

export function sliderValue(slider: GlassSlider, tuning: GlassTuning): number {
  return tuning[slider.key];
}

export function sliderPatch(
  slider: GlassSlider,
  shown: number,
): Partial<GlassTuning> {
  return { [slider.key]: shown };
}

export function formatSliderValue(slider: GlassSlider, shown: number): string {
  return shown.toFixed(slider.decimals);
}

export function isDefaultGlassTuning(tuning: GlassTuning): boolean {
  return sameTuning(tuning, DEFAULT_GLASS_TUNING);
}
