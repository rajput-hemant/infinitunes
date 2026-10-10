import { describe, expect, it } from "bun:test";

import {
  GLASS_SLIDERS,
  formatSliderValue,
  isDefaultGlassTuning,
  resolveGlassTuning,
  sliderPatch,
  sliderValue,
} from "../../app/(root)/settings/_components/glass-tuning";
import { DEFAULT_GLASS_TUNING } from "../../lib/theme-config";

function sliderNamed(label: string) {
  const slider = GLASS_SLIDERS.find((item) => item.label === label);
  if (!slider) throw new Error(`no slider ${label}`);
  return slider;
}

describe("glass tuning sliders", () => {
  it("shows transparency as the complement of the stored tint", () => {
    const transparency = sliderNamed("Transparency");
    const tuning = resolveGlassTuning(
      { ...DEFAULT_GLASS_TUNING, tint: 0.3 },
      false,
    );

    expect(sliderValue(transparency, tuning)).toBe(0.7);
    expect(sliderPatch(transparency, 0.8)).toEqual({ tint: 0.2 });
    expect(formatSliderValue(transparency, 0.7)).toBe("70%");
  });

  it("writes each slider to its config key", () => {
    expect(sliderPatch(sliderNamed("Blur"), 12.5)).toEqual({ blur: 12.5 });
    expect(sliderPatch(sliderNamed("Saturation"), 2)).toEqual({ sat: 2 });
    expect(sliderPatch(sliderNamed("Edge highlight"), 0.5)).toEqual({
      spec: 0.5,
    });
    expect(sliderPatch(sliderNamed("Ambient intensity"), 0.4)).toEqual({
      ambientLevel: 0.4,
    });
  });

  it("formats pixel and percent values", () => {
    expect(formatSliderValue(sliderNamed("Blur"), 12.5)).toBe("12.5px");
    expect(formatSliderValue(sliderNamed("Saturation"), 1.8)).toBe("180%");
  });
});

describe("resolved glass tuning", () => {
  it("fills a null tint with the scheme default", () => {
    const light = resolveGlassTuning(DEFAULT_GLASS_TUNING, false);
    const dark = resolveGlassTuning(DEFAULT_GLASS_TUNING, true);

    expect(light.tint).toBe(0.14);
    expect(dark.tint).toBe(0.24);
    expect(sliderValue(sliderNamed("Transparency"), dark)).toBe(0.76);
  });

  it("keeps an explicit tint in either scheme", () => {
    const tuning = { ...DEFAULT_GLASS_TUNING, tint: 0.5 };
    expect(resolveGlassTuning(tuning, true).tint).toBe(0.5);
  });

  it("recognises the default tuning and nothing else", () => {
    expect(isDefaultGlassTuning(DEFAULT_GLASS_TUNING)).toBe(true);
    expect(
      isDefaultGlassTuning({ ...DEFAULT_GLASS_TUNING, accentTint: true }),
    ).toBe(false);
    expect(isDefaultGlassTuning({ ...DEFAULT_GLASS_TUNING, spec: 0.9 })).toBe(
      false,
    );
  });
});
