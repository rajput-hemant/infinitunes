import { describe, expect, it } from "bun:test";

import {
  GLASS_SLIDERS,
  formatSliderValue,
  isDefaultGlassTuning,
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
  it("lists the pen's controls in order", () => {
    expect(GLASS_SLIDERS.map((slider) => slider.label)).toEqual([
      "Depth",
      "Splay",
      "Feather",
      "Curvature",
      "Blur",
      "Chromatic",
      "Glint",
      "Tint",
    ]);
  });

  it("writes each slider to its config key, unchanged", () => {
    expect(sliderPatch(sliderNamed("Depth"), 90)).toEqual({ depth: 90 });
    expect(sliderPatch(sliderNamed("Curvature"), 1.4)).toEqual({ curve: 1.4 });
    expect(sliderPatch(sliderNamed("Chromatic"), 0.1)).toEqual({ chroma: 0.1 });
    expect(sliderPatch(sliderNamed("Glint"), 80)).toEqual({ glint: 80 });
    expect(sliderPatch(sliderNamed("Tint"), 0.5)).toEqual({ tint: 0.5 });
  });

  it("reads each slider from the stored tuning", () => {
    const tuning = { ...DEFAULT_GLASS_TUNING, feather: 30, blur: 2.5 };
    expect(sliderValue(sliderNamed("Feather"), tuning)).toBe(30);
    expect(sliderValue(sliderNamed("Blur"), tuning)).toBe(2.5);
  });

  it("shows each value with the digits its step needs", () => {
    expect(formatSliderValue(sliderNamed("Depth"), 60)).toBe("60");
    expect(formatSliderValue(sliderNamed("Curvature"), 2)).toBe("2.0");
    expect(formatSliderValue(sliderNamed("Blur"), 0.05)).toBe("0.05");
    expect(formatSliderValue(sliderNamed("Chromatic"), 0.1)).toBe("0.10");
  });
});

describe("default glass tuning", () => {
  it("is recognised, and nothing else is", () => {
    expect(isDefaultGlassTuning(DEFAULT_GLASS_TUNING)).toBe(true);
    for (const patch of [
      { depth: 61 },
      { tintColor: "#ff6600" },
      { tint: 0.01 },
    ]) {
      expect(isDefaultGlassTuning({ ...DEFAULT_GLASS_TUNING, ...patch })).toBe(
        false,
      );
    }
  });
});
