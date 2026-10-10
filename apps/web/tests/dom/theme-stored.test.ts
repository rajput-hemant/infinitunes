import { afterEach, describe, expect, it } from "bun:test";

import { DEFAULT_THEME_CONFIG, parseThemeConfig } from "../../lib/theme-config";
import { serializeThemeCookie } from "../../lib/theme/cookie";
import { readStoredThemeConfig } from "../../lib/theme/stored";

afterEach(() => {
  document.cookie = "theme-config=; path=/; max-age=0";
});

describe("readStoredThemeConfig", () => {
  it("returns the defaults without a cookie", () => {
    expect(readStoredThemeConfig()).toEqual(DEFAULT_THEME_CONFIG);
  });

  it("reads the saved config and is referentially stable while unchanged", () => {
    const saved = { ...DEFAULT_THEME_CONFIG, density: "compact" as const };
    document.cookie = `theme-config=${encodeURIComponent(serializeThemeCookie(saved))}; path=/`;
    const first = readStoredThemeConfig();
    expect(first).toEqual(saved);
    expect(readStoredThemeConfig()).toBe(first);
  });

  it("the cookie's derived html field never feeds back into the parsed config", () => {
    const saved = { ...DEFAULT_THEME_CONFIG, accent: "blue" };
    expect(parseThemeConfig(serializeThemeCookie(saved))).toEqual(
      parseThemeConfig(JSON.stringify({ accent: "blue" })),
    );
  });
});
