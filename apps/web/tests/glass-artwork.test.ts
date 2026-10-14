import { describe, expect, test } from "bun:test";

import { SAMPLE_GRID, summarizePixels } from "~/lib/glass/artwork";

function grid(colour: readonly [number, number, number]) {
  const cells = SAMPLE_GRID * SAMPLE_GRID;
  const data = new Uint8ClampedArray(cells * 4);
  for (let i = 0; i < cells; i++) data.set([...colour, 255], i * 4);
  return data;
}

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

  test("returns null for an incomplete buffer", () => {
    expect(summarizePixels(new Uint8ClampedArray(16))).toBeNull();
  });
});
