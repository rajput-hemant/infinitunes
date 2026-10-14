import { describe, expect, test } from "bun:test";

import {
  MAX_LENS_AREA,
  canLens,
  chromaScales,
  easeOutCubic,
  lensKey,
  lensScale,
  lensStrength,
} from "~/lib/glass/lens-math";
import type { LensShape } from "~/lib/glass/lens-math";

describe("lens scale", () => {
  test("is the depth at strength 1, the pen's 60 by default for size s", () => {
    expect(lensScale(60, lensStrength("s", false))).toBe(60);
  });

  test("thicker surfaces refract less, and xl not at all", () => {
    expect(lensScale(60, lensStrength("m", false))).toBe(45);
    expect(lensScale(60, lensStrength("l", false))).toBeCloseTo(27);
    expect(lensScale(60, lensStrength("xl", false))).toBe(0);
  });

  test("the droplet is weaker than a plain surface", () => {
    expect(lensStrength("s", true)).toBeCloseTo(0.7);
  });

  test("materialize progress scales it from zero", () => {
    expect(lensScale(60, 1, 0)).toBe(0);
    expect(lensScale(60, 1, 0.5)).toBe(30);
  });

  test("follows the depth setting across the pen's range", () => {
    expect(lensScale(0, 1)).toBe(0);
    expect(lensScale(120, 1)).toBe(120);
  });
});

describe("chromaScales", () => {
  test("red takes the larger displacement, green and blue the smaller", () => {
    const { red, rest } = chromaScales(60, 0.1);
    expect(red).toBeCloseTo(66);
    expect(rest).toBeCloseTo(54);
  });

  test("no chroma leaves both passes equal", () => {
    expect(chromaScales(60, 0)).toEqual({ red: 60, rest: 60 });
  });
});

describe("canLens", () => {
  const base = { size: "m", width: 300, height: 60, off: false } as const;

  test("allows a normal surface", () => {
    expect(canLens(base)).toBe(true);
  });

  test("never lenses xl", () => {
    expect(canLens({ ...base, size: "xl" })).toBe(false);
  });

  test("respects the opt-out", () => {
    expect(canLens({ ...base, off: true })).toBe(false);
  });

  test("skips tiny and huge surfaces", () => {
    expect(canLens({ ...base, width: 7 })).toBe(false);
    expect(canLens({ ...base, height: 7 })).toBe(false);
    expect(canLens({ ...base, width: 900, height: 700 })).toBe(true);
    expect(canLens({ ...base, width: 901, height: 700 })).toBe(false);
    expect(MAX_LENS_AREA).toBe(630_000);
  });
});

describe("lensKey", () => {
  const shape: LensShape = {
    splay: 2,
    feather: 24,
    curve: 2,
    chromatic: false,
    tinted: false,
    fixed: null,
  };

  test("distinguishes every input that changes the map or the filter", () => {
    const base = lensKey(300, 60, 20, "m", false, shape);
    expect(lensKey(300, 60, 20, "m", false, shape)).toBe(base);
    expect(lensKey(301, 60, 20, "m", false, shape)).not.toBe(base);
    expect(lensKey(300, 60, 21, "m", false, shape)).not.toBe(base);
    expect(lensKey(300, 60, 20, "s", false, shape)).not.toBe(base);
    expect(lensKey(300, 60, 20, "m", true, shape)).not.toBe(base);
    expect(lensKey(300, 60, 20, "m", false, shape, { x: 44, y: 30 })).not.toBe(
      base,
    );
    for (const changed of [
      { ...shape, splay: 3 },
      { ...shape, feather: 25 },
      { ...shape, curve: 2.1 },
      { ...shape, chromatic: true },
      { ...shape, tinted: true },
      {
        ...shape,
        fixed: { depth: 90, chroma: 0, tint: 0, tintColor: "#ffffff" },
      },
      {
        ...shape,
        fixed: { depth: 90, chroma: 0, tint: 0.5, tintColor: "#ffffff" },
      },
    ]) {
      expect(lensKey(300, 60, 20, "m", false, changed)).not.toBe(base);
    }
  });
});

describe("easeOutCubic", () => {
  test("runs from 0 to 1, fast at first", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
