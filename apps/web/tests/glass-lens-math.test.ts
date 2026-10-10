import { describe, expect, test } from "bun:test";

import {
  MAX_LENS_AREA,
  bezelFor,
  canLens,
  easeOutCubic,
  lensKey,
  lensScale,
  lensStrength,
  specularSlope,
} from "~/lib/glass/lens-math";

describe("lens scale", () => {
  test("is twice the refraction at strength 1, the mockup's 60 for size s", () => {
    expect(lensScale(30, lensStrength("s", false))).toBe(60);
  });

  test("thicker surfaces refract less, and xl not at all", () => {
    expect(lensScale(30, lensStrength("m", false))).toBe(45);
    expect(lensScale(30, lensStrength("l", false))).toBeCloseTo(27);
    expect(lensScale(30, lensStrength("xl", false))).toBe(0);
  });

  test("the droplet is weaker than a plain surface", () => {
    expect(lensStrength("s", true)).toBeCloseTo(0.7);
  });

  test("materialize progress scales it from zero", () => {
    expect(lensScale(30, 1, 0)).toBe(0);
    expect(lensScale(30, 1, 0.5)).toBe(30);
  });

  test("follows the refraction setting", () => {
    expect(lensScale(0, 1)).toBe(0);
    expect(lensScale(48, 1)).toBe(96);
  });
});

describe("specular slope", () => {
  test("scales with the highlight setting and caps at 1.5", () => {
    expect(specularSlope(1)).toBeCloseTo(0.8);
    expect(specularSlope(0)).toBe(0);
    expect(specularSlope(1.6)).toBeCloseTo(1.28);
    expect(specularSlope(3)).toBe(1.5);
  });
});

describe("bezelFor", () => {
  test("never exceeds the corner radius", () => {
    expect(bezelFor(200, 60, 6, "s")).toBe(6);
  });

  test("thin surfaces use the bezel share of their short side", () => {
    expect(bezelFor(400, 40, 30, "s")).toBe(13);
    expect(bezelFor(400, 60, 30, "m")).toBe(13);
  });

  test("is capped per size", () => {
    expect(bezelFor(400, 60, 30, "s")).toBe(18);
    expect(bezelFor(900, 600, 80, "m")).toBe(18);
    expect(bezelFor(900, 600, 80, "l")).toBe(22);
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
  test("distinguishes every input that changes the map", () => {
    const base = lensKey(300, 60, 20, "m", false);
    expect(lensKey(300, 60, 20, "m", false)).toBe(base);
    expect(lensKey(301, 60, 20, "m", false)).not.toBe(base);
    expect(lensKey(300, 60, 21, "m", false)).not.toBe(base);
    expect(lensKey(300, 60, 20, "s", false)).not.toBe(base);
    expect(lensKey(300, 60, 20, "m", true)).not.toBe(base);
  });
});

describe("easeOutCubic", () => {
  test("runs from 0 to 1, fast at first", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
