import { describe, expect, test } from "bun:test";

import {
  DEFAULT_GLASS_TUNING,
  GLASS_PRESETS,
  GLASS_PRESET_IDS,
  GLASS_RANGES,
  glassPaintVars,
  matchingPreset,
  normalizeGlassTuning,
} from "~/lib/glass/tuning";

describe("glass tuning ranges and defaults", () => {
  test("defaults are the pen's rim with a lightly frosted blur, and sit inside their ranges", () => {
    expect(DEFAULT_GLASS_TUNING).toEqual({
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
    for (const [key, { min, max }] of Object.entries(GLASS_RANGES)) {
      const value = DEFAULT_GLASS_TUNING[key as keyof typeof GLASS_RANGES];
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  });

  test("every preset is a complete, valid tuning", () => {
    for (const id of GLASS_PRESET_IDS) {
      const { tuning } = GLASS_PRESETS[id];
      expect(normalizeGlassTuning(tuning)).toEqual(tuning);
    }
  });

  test("the presets carry the pen's exact values", () => {
    expect(GLASS_PRESETS.simple.tuning).toEqual(DEFAULT_GLASS_TUNING);
    expect(GLASS_PRESETS.thick.tuning).toMatchObject({
      depth: 120,
      splay: 2,
      feather: 30,
      curve: 3,
      glint: 60,
    });
    expect(GLASS_PRESETS.frosted.tuning).toMatchObject({
      depth: 120,
      splay: 16,
      feather: 26,
      curve: 2.6,
      blur: 5,
      glint: 20,
    });
    expect(GLASS_PRESETS.cut.tuning).toMatchObject({
      depth: 120,
      splay: 40,
      feather: 40,
      curve: 0.6,
      blur: 0.05,
      glint: 15,
    });
    expect(GLASS_PRESETS.plexi.tuning).toMatchObject({
      depth: 60,
      splay: 4,
      feather: 10,
      curve: 1.2,
      blur: 2.5,
      glint: 25,
      tint: 0.94,
      tintColor: "#ff6600",
    });
  });

  test("matchingPreset names a preset only on an exact match", () => {
    expect(matchingPreset(GLASS_PRESETS.cut.tuning)).toBe("cut");
    expect(
      matchingPreset({ ...GLASS_PRESETS.cut.tuning, depth: 119 }),
    ).toBeNull();
  });
});

describe("normalizeGlassTuning", () => {
  test("clamps each number into its range", () => {
    expect(
      normalizeGlassTuning({
        depth: 999,
        splay: -4,
        curve: 0,
        blur: 50,
        chroma: 1,
      }),
    ).toMatchObject({
      depth: 120,
      splay: 2,
      curve: 0.3,
      blur: 5,
      chroma: 0.25,
    });
  });

  test("falls back per field on the wrong type, never throwing", () => {
    for (const value of [null, undefined, 3, "x", [], () => 1]) {
      expect(normalizeGlassTuning(value)).toEqual(DEFAULT_GLASS_TUNING);
    }
    expect(
      normalizeGlassTuning({ depth: "90", glint: Number.NaN, tint: null }),
    ).toEqual(DEFAULT_GLASS_TUNING);
  });

  test("accepts a colour only as a hex, lower-cased and expanded", () => {
    expect(normalizeGlassTuning({ tintColor: "#F60" }).tintColor).toBe(
      "#ff6600",
    );
    for (const bad of ["orange", "#12", "rgb(0,0,0)", "#fff; x", 7, null]) {
      expect(normalizeGlassTuning({ tintColor: bad }).tintColor).toBe(
        "#ffffff",
      );
    }
  });

  test("maps an old cookie to the defaults for the fields it no longer has", () => {
    const old = {
      variant: "clear",
      tint: null,
      blur: 3,
      refraction: 30,
      sat: 1.8,
      spec: 1,
      shadow: 1,
      ambientLevel: 0.62,
      accentTint: true,
    };
    expect(normalizeGlassTuning(old)).toEqual({
      ...DEFAULT_GLASS_TUNING,
      blur: 3,
    });
  });
});

describe("glassPaintVars", () => {
  test("writes the paint half of a tuning as custom properties", () => {
    expect(glassPaintVars(GLASS_PRESETS.plexi.tuning)).toEqual({
      "--glass-blur": "2.5px",
      "--glass-glint": "0.25",
      "--glass-tint": "0.94",
      "--glass-tint-c": "#ff6600",
    });
  });
});
