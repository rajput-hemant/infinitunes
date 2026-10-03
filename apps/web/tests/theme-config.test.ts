import { describe, expect, test } from "bun:test";

import { DEFAULT_THEME_CONFIG, parseThemeConfig } from "~/lib/theme-config";

describe("parseThemeConfig", () => {
  test("uses defaults when the cookie is absent", () => {
    expect(parseThemeConfig(undefined)).toEqual(DEFAULT_THEME_CONFIG);
  });

  test("reads a valid cookie", () => {
    expect(parseThemeConfig('{"theme":"rose","radius":0.5}')).toEqual({
      theme: "rose",
      radius: 0.5,
    });
  });

  test("falls back on malformed JSON instead of throwing", () => {
    expect(parseThemeConfig("{not json")).toEqual(DEFAULT_THEME_CONFIG);
    expect(parseThemeConfig("")).toEqual(DEFAULT_THEME_CONFIG);
  });

  test("falls back on JSON of the wrong shape", () => {
    for (const raw of ["null", "42", '"x"', "[]"]) {
      expect(parseThemeConfig(raw)).toEqual(DEFAULT_THEME_CONFIG);
    }
  });

  test("falls back per field on invalid values", () => {
    expect(parseThemeConfig('{"theme":7,"radius":"huge"}')).toEqual(
      DEFAULT_THEME_CONFIG,
    );
    expect(parseThemeConfig('{"theme":"rose"}')).toEqual({
      theme: "rose",
      radius: "default",
    });
  });
});
