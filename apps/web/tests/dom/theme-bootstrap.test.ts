import { afterEach, describe, expect, it } from "bun:test";

import { DEFAULT_THEME_CONFIG } from "../../lib/theme-config";
import { THEME_BOOTSTRAP_SCRIPT } from "../../lib/theme-script";
import { serializeThemeCookie } from "../../lib/theme/cookie";

const run = () => new Function(THEME_BOOTSTRAP_SCRIPT)();
const setCookie = (raw: string) => {
  document.cookie = `theme-config=${encodeURIComponent(raw)}; path=/`;
};

// The color-scheme step always sets a class and `color-scheme`; these are the
// parts only the appearance step can add.
const appliedByAppearance = () => [
  ...document.documentElement
    .getAttributeNames()
    .filter((n) => n !== "class" && n !== "style"),
  ...(document.documentElement.style.cssText.match(/--[a-z-]+(?=:)/g) ?? []),
];

afterEach(() => {
  document.cookie = "theme-config=; path=/; max-age=0";
  localStorage.clear();
  const html = document.documentElement;
  for (const name of [...html.getAttributeNames()]) html.removeAttribute(name);
});

describe("theme bootstrap script", () => {
  it("applies the saved appearance to <html> before paint", () => {
    setCookie(
      serializeThemeCookie({
        ...DEFAULT_THEME_CONFIG,
        accent: "blue",
        radius: 0.5,
        density: "compact",
        textSize: 18,
        ambient: false,
        reduceMotion: true,
        glassTuning: { ...DEFAULT_THEME_CONFIG.glassTuning, blur: 8 },
      }),
    );
    run();
    const html = document.documentElement;
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(html.getAttribute("data-ambient")).toBe("off");
    expect(html.getAttribute("data-motion")).toBe("reduced");
    expect(html.style.getPropertyValue("--radius")).toBe("0.5rem");
    expect(html.style.getPropertyValue("--text-scale")).toBe("1.125");
    expect(html.style.getPropertyValue("--glass-blur")).toBe("8px");
    expect(html.style.getPropertyValue("--light-primary")).toMatch(/^oklch/);
  });

  it("does nothing without a cookie", () => {
    run();
    expect(appliedByAppearance()).toEqual([]);
  });

  it("ignores a legacy cookie without the precomputed html field", () => {
    setCookie('{"theme":"rose","radius":0.5}');
    run();
    expect(appliedByAppearance()).toEqual([]);
  });

  it("ignores malformed cookies and unsafe names or values", () => {
    for (const raw of [
      "{not json",
      "null",
      '{"html":7}',
      '{"html":{"a":{"onclick":"x","data-x":"a b","data-ok":"<b>"},"s":{"color":"red","--x":"url(x)"}}}',
    ]) {
      setCookie(raw);
      run();
      expect(appliedByAppearance()).toEqual([]);
    }
  });

  it("applies the stored light/dark choice like next-themes", () => {
    localStorage.setItem("theme", "dark");
    run();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("ignores unknown stored theme values", () => {
    localStorage.setItem("theme", "<script>");
    run();
    expect(document.documentElement.className).toBe("");
  });
});
