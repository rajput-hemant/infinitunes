import { test, describe, expect } from "bun:test";

import {
  roundedRectSDF,
  createDisplacementMap,
  createSpecularMap,
  GlassMapCache,
} from "~/lib/glass/engine";

describe("roundedRectSDF", () => {
  test("determinism and bounds", () => {
    const res = roundedRectSDF(5, 5, 10, 10, 2);
    expect(res).toBeDefined();
    expect(typeof res.d).toBe("number");
    expect(typeof res.nx).toBe("number");
    expect(typeof res.ny).toBe("number");
  });

  test("symmetry", () => {
    // A point at (2, 2) on a 10x10 rect
    const tl = roundedRectSDF(2, 2, 10, 10, 2);
    // Corresponding point at (8, 8)
    const br = roundedRectSDF(8, 8, 10, 10, 2);
    expect(tl.d).toBeCloseTo(br.d);
    // Normals should be inverted symmetrically
    expect(tl.nx).toBeCloseTo(-br.nx);
    expect(tl.ny).toBeCloseTo(-br.ny);
  });
});

describe("createDisplacementMap", () => {
  test("determinism", () => {
    const map1 = createDisplacementMap({
      width: 10,
      height: 10,
      radius: 2,
      bezel: 2,
    });
    const map2 = createDisplacementMap({
      width: 10,
      height: 10,
      radius: 2,
      bezel: 2,
    });
    expect(map1.width).toBe(10);
    expect(map1.height).toBe(10);
    expect(map1.data).toEqual(map2.data);
  });

  test("bounds check", () => {
    const map = createDisplacementMap({
      width: 10,
      height: 10,
      radius: 2,
      bezel: 2,
    });
    expect(map.data.length).toBe(10 * 10 * 4);
    for (let i = 0; i < map.data.length; i += 4) {
      expect(map.data[i]).toBeGreaterThanOrEqual(0);
      expect(map.data[i]).toBeLessThanOrEqual(255);
      expect(map.data[i + 1]).toBeGreaterThanOrEqual(0);
      expect(map.data[i + 1]).toBeLessThanOrEqual(255);
      expect(map.data[i + 2]).toBe(128); // B is 128
      expect(map.data[i + 3]).toBe(255); // A is 255
    }
  });
});

describe("createSpecularMap", () => {
  test("determinism", () => {
    const map1 = createSpecularMap({
      width: 10,
      height: 10,
      radius: 2,
      bezel: 2,
    });
    const map2 = createSpecularMap({
      width: 10,
      height: 10,
      radius: 2,
      bezel: 2,
    });
    expect(map1.width).toBe(10);
    expect(map1.height).toBe(10);
    expect(map1.data).toEqual(map2.data);
  });

  test("bounds check", () => {
    const map = createSpecularMap({
      width: 10,
      height: 10,
      radius: 2,
      bezel: 2,
    });
    expect(map.data.length).toBe(10 * 10 * 4);
    for (let i = 0; i < map.data.length; i += 4) {
      expect(map.data[i]).toBe(255); // R
      expect(map.data[i + 1]).toBe(255); // G
      expect(map.data[i + 2]).toBe(255); // B
      expect(map.data[i + 3]).toBeGreaterThanOrEqual(0); // A
      expect(map.data[i + 3]).toBeLessThanOrEqual(255);
    }
  });
});

describe("GlassMapCache", () => {
  test("cache key and cache cap of 24", () => {
    const cache = new GlassMapCache();
    expect(cache.getKey("disp", 10, 10, 2, 2)).toBe("disp:10:10:2:2");

    for (let i = 0; i < 30; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    // Size is max 24, so first 6 should be evicted
    for (let i = 0; i < 6; i++) {
      expect(cache.get(`key${i}`)).toBeUndefined();
    }
    for (let i = 6; i < 30; i++) {
      expect(cache.get(`key${i}`)).toBe(`value${i}`);
    }
  });
});
