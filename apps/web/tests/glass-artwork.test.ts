import { describe, expect, test } from "bun:test";

import {
  SAMPLE_GRID,
  fromHsl,
  rgbCss,
  summarizePixels,
  toHsl,
  vividSet,
} from "~/lib/glass/artwork";
import type { Rgb } from "~/lib/glass/artwork";

function grid(colour: Rgb, overrides: Record<number, Rgb> = {}) {
  const cells = SAMPLE_GRID * SAMPLE_GRID;
  const data = new Uint8ClampedArray(cells * 4);
  for (let i = 0; i < cells; i++) {
    const [r, g, b] = overrides[i] ?? colour;
    data.set([r, g, b, 255], i * 4);
  }
  return data;
}

const hueGap = (a: number, b: number) =>
  Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

describe("summarizePixels", () => {
  test("white artwork has luminance 1, black has 0", () => {
    expect(summarizePixels(grid([255, 255, 255]))?.luminance).toBeCloseTo(1);
    expect(summarizePixels(grid([0, 0, 0]))?.luminance).toBeCloseTo(0);
  });

  test("mid grey is darker than 0.5 in linear light", () => {
    const l = summarizePixels(grid([128, 128, 128]))?.luminance ?? 0;
    expect(l).toBeGreaterThan(0.2);
    expect(l).toBeLessThan(0.25);
  });

  test("averages the cells", () => {
    const sample = summarizePixels(grid([200, 100, 0]));
    expect(sample?.avg).toEqual([200, 100, 0]);
  });

  test("returns null for an incomplete buffer", () => {
    expect(summarizePixels(new Uint8ClampedArray(16))).toBeNull();
  });

  test("seeds each blob from the most saturated cell of its row band", () => {
    const red: Rgb = [230, 20, 20];
    const green: Rgb = [20, 230, 20];
    const blue: Rgb = [20, 20, 230];
    const sample = summarizePixels(
      grid([120, 120, 120], { 5: red, 30: green, 50: blue }),
    );
    const hues = sample?.blobs.map((b) => Math.round(toHsl(b)[0])) ?? [];
    expect(hueGap(hues[0], 0)).toBeLessThan(5);
    expect(hueGap(hues[1], 120)).toBeLessThan(5);
    expect(hueGap(hues[2], 240)).toBeLessThan(5);
  });
});

describe("vividSet", () => {
  test("pushes every blob to a vivid swatch", () => {
    for (const [, s, l] of vividSet([
      [120, 120, 120],
      [90, 40, 40],
      [10, 10, 10],
    ]).map(toHsl)) {
      expect(s).toBeGreaterThanOrEqual(0.69);
      expect(l).toBeGreaterThanOrEqual(0.49);
      expect(l).toBeLessThanOrEqual(0.63);
    }
  });

  test("rotates blobs 2 and 3 when all hues are close (warm covers)", () => {
    const warm: [Rgb, Rgb, Rgb] = [
      [230, 80, 40],
      [235, 100, 50],
      [225, 90, 30],
    ];
    const [a, b, c] = vividSet(warm).map((x) => toHsl(x)[0]);
    expect(hueGap(a, b)).toBeGreaterThanOrEqual(55);
    expect(hueGap(a, c)).toBeGreaterThanOrEqual(55);
  });

  test("leaves already varied hues alone", () => {
    const varied: [Rgb, Rgb, Rgb] = [
      [230, 30, 30],
      [30, 230, 30],
      [30, 30, 230],
    ];
    const hues = vividSet(varied).map((x) => Math.round(toHsl(x)[0]));
    expect(hueGap(hues[0], 0)).toBeLessThan(5);
    expect(hueGap(hues[1], 120)).toBeLessThan(5);
  });
});

describe("hsl conversion", () => {
  test("round trips primary colours", () => {
    for (const rgb of [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 128, 0],
    ] as const) {
      expect(fromHsl(toHsl(rgb))).toEqual([...rgb]);
    }
  });

  test("formats as space separated CSS", () => {
    expect(rgbCss([1, 2, 3])).toBe("rgb(1 2 3)");
  });
});
