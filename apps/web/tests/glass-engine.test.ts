import { describe, expect, test } from "bun:test";

import {
  createDisplacementMap,
  ringAmount,
  roundedRectSDF,
} from "~/lib/glass/engine";

const PEN = { splay: 2, feather: 24, curve: 2 };

describe("roundedRectSDF", () => {
  test("is negative inside, zero on the edge and positive outside", () => {
    expect(roundedRectSDF(0, 0, 50, 50, 10)).toBeLessThan(0);
    expect(roundedRectSDF(50, 0, 50, 50, 10)).toBeCloseTo(0);
    expect(roundedRectSDF(60, 0, 50, 50, 10)).toBeCloseTo(10);
  });

  test("is symmetric about the centre", () => {
    expect(roundedRectSDF(-20, -12, 50, 30, 8)).toBeCloseTo(
      roundedRectSDF(20, 12, 50, 30, 8),
    );
  });

  test("rounds the corner: the distance there is the corner radius off", () => {
    // On the corner arc, 45 degrees out from its centre (40, 40) with r = 10.
    const on = 40 + 10 * Math.SQRT1_2;
    expect(roundedRectSDF(on, on, 50, 50, 10)).toBeCloseTo(0);
  });
});

describe("ringAmount", () => {
  test("is 1 on the edge and 0 beyond the ring", () => {
    expect(ringAmount(0, 2, 24, 2)).toBe(1);
    expect(ringAmount(-26, 2, 24, 2)).toBe(0);
    expect(ringAmount(-100, 2, 24, 2)).toBe(0);
    expect(ringAmount(2, 2, 24, 2)).toBe(0);
  });

  test("the inner side reaches splay + feather, the outer side only splay", () => {
    expect(ringAmount(-20, 2, 24, 2)).toBeGreaterThan(0);
    expect(ringAmount(1.5, 2, 24, 2)).toBeGreaterThan(0);
    expect(ringAmount(-1, 2, 24, 2)).toBeGreaterThan(ringAmount(1, 2, 24, 2));
  });

  test("falls off monotonically, and a higher curve is sharper", () => {
    let last = 1;
    for (let s = 0; s >= -26; s -= 2) {
      const amt = ringAmount(s, 2, 24, 2);
      expect(amt).toBeLessThanOrEqual(last);
      last = amt;
    }
    expect(ringAmount(-8, 2, 24, 3)).toBeLessThan(ringAmount(-8, 2, 24, 0.6));
  });
});

describe("createDisplacementMap", () => {
  const base = { width: 120, height: 60, radius: 16, ...PEN };

  test("is deterministic and sized to the box", () => {
    const a = createDisplacementMap(base);
    const b = createDisplacementMap(base);
    expect([a.width, a.height]).toEqual([120, 60]);
    expect(a.data.length).toBe(120 * 60 * 4);
    expect(a.data).toEqual(b.data);
  });

  test("keeps blue at 128 and alpha opaque everywhere", () => {
    const map = createDisplacementMap(base);
    for (let i = 0; i < map.data.length; i += 4) {
      expect(map.data[i + 2]).toBe(128);
      expect(map.data[i + 3]).toBe(255);
    }
  });

  const at = (
    map: ReturnType<typeof createDisplacementMap>,
    x: number,
    y: number,
  ) => {
    const i = (y * map.width + x) * 4;
    return [map.data[i], map.data[i + 1]] as const;
  };

  test("the middle of a wide surface does not displace", () => {
    const map = createDisplacementMap({ ...base, width: 200, height: 120 });
    expect(at(map, 100, 60)).toEqual([128, 128]);
  });

  test("the rim pulls content inward from every side", () => {
    const map = createDisplacementMap({ ...base, width: 200, height: 120 });
    // Left edge samples from the right (R above 128), right edge from the left.
    expect(at(map, 0, 60)[0]).toBeGreaterThan(128);
    expect(at(map, 199, 60)[0]).toBeLessThan(128);
    expect(at(map, 100, 0)[1]).toBeGreaterThan(128);
    expect(at(map, 100, 119)[1]).toBeLessThan(128);
  });

  test("has 4-fold symmetry: mirrored pixels are negated offsets", () => {
    const map = createDisplacementMap({ ...base, width: 121, height: 61 });
    for (const [x, y] of [
      [0, 0],
      [3, 9],
      [10, 30],
      [25, 2],
    ]) {
      const [r, g] = at(map, x, y);
      const [rx, gx] = at(map, 120 - x, y);
      const [ry, gy] = at(map, x, 60 - y);
      expect(r + rx).toBeGreaterThanOrEqual(254);
      expect(r + rx).toBeLessThanOrEqual(256);
      expect(g).toBe(gx);
      expect(r).toBe(ry);
      expect(g + gy).toBeGreaterThanOrEqual(254);
      expect(g + gy).toBeLessThanOrEqual(256);
    }
  });

  test("never clips: displacement stays inside 80% of the channel range", () => {
    const map = createDisplacementMap({ ...base, splay: 40, feather: 40 });
    for (let i = 0; i < map.data.length; i += 4) {
      expect(Math.abs(map.data[i] - 127.5)).toBeLessThanOrEqual(102);
      expect(Math.abs(map.data[i + 1] - 127.5)).toBeLessThanOrEqual(102);
    }
  });

  test("magnify pulls every pixel toward the centre", () => {
    const flat = createDisplacementMap({ ...base, width: 200, height: 120 });
    const lifted = createDisplacementMap({
      ...base,
      width: 200,
      height: 120,
      magnify: 0.12,
    });
    expect(at(lifted, 50, 60)[0]).toBeGreaterThan(at(flat, 50, 60)[0]);
    expect(at(lifted, 150, 60)[0]).toBeLessThan(at(flat, 150, 60)[0]);
  });

  test("a wider splay or feather reaches further in", () => {
    const reach = (opts: { splay: number; feather: number }) => {
      const map = createDisplacementMap({
        ...base,
        width: 200,
        height: 120,
        ...opts,
      });
      let x = 0;
      while (x < 100 && at(map, x, 60)[0] !== 128) x++;
      return x;
    };
    expect(reach({ splay: 2, feather: 24 })).toBeLessThan(
      reach({ splay: 2, feather: 40 }),
    );
    expect(reach({ splay: 2, feather: 24 })).toBeLessThan(
      reach({ splay: 20, feather: 24 }),
    );
  });
});
