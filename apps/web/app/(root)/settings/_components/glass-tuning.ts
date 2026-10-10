export const GLASS_VARIANTS = ["regular", "clear", "tinted"] as const;
export type GlassVariant = (typeof GLASS_VARIANTS)[number];

/** Fine tuning of the Liquid Glass material, beyond the three levels in `ThemeConfig`. */
export type GlassTuning = {
  variant: GlassVariant;
  /** Alpha of the glass tint, 0.1 to 1. */
  tint: number;
  /** Backdrop blur in px. */
  blur: number;
  /** Lens displacement in px. */
  refraction: number;
  /** Backdrop saturation multiplier. */
  saturation: number;
  /** Edge highlight strength. */
  highlight: number;
  shadow: number;
  /** Strength of the artwork colour field behind the glass. */
  ambientLevel: number;
  accentTint: boolean;
};

export type GlassSliderKey = Exclude<
  keyof GlassTuning,
  "variant" | "accentTint"
>;

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
    key: "saturation",
    label: "Saturation",
    min: 1,
    max: 2.6,
    step: 0.05,
    unit: "percent",
  },
  {
    key: "highlight",
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

export function sliderValue(slider: GlassSlider, tuning: GlassTuning) {
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
