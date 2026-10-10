import { describe, expect, test } from "bun:test";

import {
  DEFAULT_LIGHT,
  LIGHT_REACH,
  lightAngle,
  orientationLight,
} from "~/lib/glass/light";

const box = { left: 100, top: 100, right: 300, bottom: 160 };

describe("lightAngle", () => {
  test("is null when the pointer is out of reach", () => {
    expect(
      lightAngle(box, { x: 100 + 200 + LIGHT_REACH + 1, y: 130 }),
    ).toBeNull();
  });

  // CSS gradient angles point where the gradient runs to, so a highlight that
  // starts at the pointer's side runs away from it: 180deg for a pointer above.
  test("a pointer above the surface starts the highlight at the top", () => {
    expect(lightAngle(box, { x: 200, y: 99 })).toBeCloseTo(180, 0);
  });

  test("a pointer to the right of the surface starts the highlight on the right", () => {
    expect(lightAngle(box, { x: 301, y: 130 })).toBeCloseTo(270, 0);
  });

  test("blends back toward the default light with distance", () => {
    const near = lightAngle(box, { x: 305, y: 130 }) ?? 0;
    const far = lightAngle(box, { x: 300 + LIGHT_REACH - 1, y: 130 }) ?? 0;
    expect(Math.abs(far - DEFAULT_LIGHT)).toBeLessThan(
      Math.abs(near - DEFAULT_LIGHT),
    );
    expect(far).toBeCloseTo(DEFAULT_LIGHT, 0);
  });
});

describe("orientationLight", () => {
  test("tilts the default light by roll, clamped to 40 degrees", () => {
    expect(orientationLight(0)).toBe(DEFAULT_LIGHT);
    expect(orientationLight(10)).toBeCloseTo(DEFAULT_LIGHT + 12);
    expect(orientationLight(90)).toBeCloseTo(DEFAULT_LIGHT + 48);
    expect(orientationLight(-90)).toBeCloseTo(DEFAULT_LIGHT - 48);
  });
});
