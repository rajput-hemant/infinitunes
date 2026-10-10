import { afterEach, describe, expect, it } from "bun:test";

import { parseThemeConfig } from "../../lib/theme-config";
import { THEME_BOOTSTRAP_SCRIPT } from "../../lib/theme-script";

const run = () => new Function(THEME_BOOTSTRAP_SCRIPT)();
const setConfig = (raw: string) => {
  document.cookie = `theme-config=${encodeURIComponent(raw)}; path=/`;
};

afterEach(() => {
  document.cookie = "theme-config=; path=/; max-age=0";
  localStorage.clear();
  document.documentElement.removeAttribute("class");
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("class");
  document.body.removeAttribute("style");
});

describe("theme bootstrap script", () => {
  it("applies the cookie preset and radius to the body", () => {
    setConfig('{"theme":"rose","radius":0.5}');
    run();
    expect(document.body.classList.contains("theme-rose")).toBe(true);
    expect(document.body.style.getPropertyValue("--radius")).toBe("0.5rem");
  });

  it("does nothing without a cookie", () => {
    run();
    expect(document.body.className).toBe("");
    expect(document.body.getAttribute("style")).toBeNull();
  });

  it("agrees with parseThemeConfig on valid and malformed cookies", () => {
    for (const raw of [
      '{"theme":"zinc","radius":0}',
      '{"theme":"default","radius":"default"}',
      '{"theme":7,"radius":"huge"}',
      '{"theme":"a b","radius":2}',
      "{not json",
      "null",
    ]) {
      setConfig(raw);
      run();
      const { theme, radius } = parseThemeConfig(raw);
      const expectedClass = theme !== "default" && /^[a-z]+$/.test(theme);
      expect(document.body.classList.contains(`theme-${theme}`)).toBe(
        expectedClass,
      );
      expect(document.body.style.getPropertyValue("--radius")).toBe(
        radius === "default" ? "" : `${radius}rem`,
      );
      document.body.removeAttribute("class");
      document.body.removeAttribute("style");
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
