import { describe, expect, test } from "bun:test";

import {
  isLensCapable,
  lensActive,
  parseLensOverride,
} from "~/lib/glass/capabilities";

const chromium = {
  override: null,
  backdropUrlSyntax: true,
  svgPrimitives: true,
  chromium: true,
} as const;

describe("parseLensOverride", () => {
  test("reads ?lens=0 and ?lens=1 only", () => {
    expect(parseLensOverride("?lens=0")).toBe("off");
    expect(parseLensOverride("?a=1&lens=1")).toBe("force");
    expect(parseLensOverride("?lens=2")).toBeNull();
    expect(parseLensOverride("")).toBeNull();
  });
});

describe("isLensCapable", () => {
  test("Chromium with the SVG primitives refracts", () => {
    expect(isLensCapable(chromium)).toBe(true);
  });

  test("Safari and Firefox parse the syntax but are not Chromium", () => {
    expect(isLensCapable({ ...chromium, chromium: false })).toBe(false);
  });

  test("missing syntax or primitives disables it", () => {
    expect(isLensCapable({ ...chromium, backdropUrlSyntax: false })).toBe(
      false,
    );
    expect(isLensCapable({ ...chromium, svgPrimitives: false })).toBe(false);
  });

  test("?lens=0 forces the fallback even on Chromium", () => {
    expect(isLensCapable({ ...chromium, override: "off" })).toBe(false);
  });

  test("?lens=1 skips the engine check but not the feature checks", () => {
    const other = { ...chromium, chromium: false, override: "force" } as const;
    expect(isLensCapable(other)).toBe(true);
    expect(isLensCapable({ ...other, svgPrimitives: false })).toBe(false);
  });
});

describe("lensActive", () => {
  const on = {
    capable: true,
    level: "liquid",
    reducedTransparency: false,
    highContrast: false,
  } as const;

  test("runs when capable and nothing opts out", () => {
    expect(lensActive(on)).toBe(true);
    expect(lensActive({ ...on, level: "subtle" })).toBe(true);
  });

  test("is off for Solid, reduced transparency, more contrast, or no support", () => {
    expect(lensActive({ ...on, level: "solid" })).toBe(false);
    expect(lensActive({ ...on, reducedTransparency: true })).toBe(false);
    expect(lensActive({ ...on, highContrast: true })).toBe(false);
    expect(lensActive({ ...on, capable: false })).toBe(false);
  });
});
