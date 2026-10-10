import { afterEach, describe, expect, it } from "bun:test";

import { DEFAULT_THEME_CONFIG } from "../../lib/theme-config";
import { THEME_BOOTSTRAP_SCRIPT } from "../../lib/theme-script";
import { serializeThemeCookie } from "../../lib/theme/cookie";
import { themeConfigToHtml } from "../../lib/theme/html";
import { MANAGED_ATTRIBUTES, MANAGED_VARIABLES } from "../../lib/theme/managed";

const run = () => new Function(THEME_BOOTSTRAP_SCRIPT)();
const setCookie = (raw: string) => {
  document.cookie = `theme-config=${encodeURIComponent(raw)}; path=/`;
};

// The color-scheme step always sets a class and `color-scheme`, and the queue
// step sets `data-queue`; these are the parts only the appearance step can add.
const appliedByAppearance = () => [
  ...document.documentElement
    .getAttributeNames()
    .filter((n) => n !== "class" && n !== "style" && n !== "data-queue"),
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

  it("allowlists exactly what themeConfigToHtml can emit", () => {
    const tuning = DEFAULT_THEME_CONFIG.glassTuning;
    const everything = themeConfigToHtml({
      ...DEFAULT_THEME_CONFIG,
      accent: "blue",
      radius: 0.5,
      textSize: 18,
      glassTuning: {
        variant: "clear",
        tint: 0.3,
        blur: tuning.blur + 1,
        refraction: tuning.refraction + 1,
        sat: tuning.sat + 0.1,
        spec: tuning.spec + 0.1,
        shadow: tuning.shadow + 0.1,
        ambientLevel: tuning.ambientLevel + 0.1,
        accentTint: true,
      },
    });
    expect(Object.keys(everything.attributes).sort()).toEqual(
      [...MANAGED_ATTRIBUTES].sort(),
    );
    expect(Object.keys(everything.style).sort()).toEqual(
      [...MANAGED_VARIABLES].sort(),
    );

    // The script embeds the same lists, so every emitted name is applied.
    setCookie(
      JSON.stringify({
        html: { a: everything.attributes, s: everything.style },
      }),
    );
    run();
    for (const name of MANAGED_ATTRIBUTES) {
      expect(document.documentElement.hasAttribute(name)).toBe(true);
    }
    for (const name of MANAGED_VARIABLES) {
      expect(document.documentElement.style.getPropertyValue(name)).not.toBe(
        "",
      );
    }
  });

  it("ignores well-formed names the appearance engine never emits", () => {
    // Closed queue: only a cookie could still put data-queue on <html>.
    localStorage.setItem("queue_open", "false");
    setCookie(
      JSON.stringify({
        html: {
          a: {
            "data-queue": "open",
            "data-glass-engine": "lens",
            "data-density": "compact",
          },
          s: { "--toast-offset-bottom": "10px", "--radius": "0.5rem" },
        },
      }),
    );
    run();
    const html = document.documentElement;
    expect(html.getAttribute("data-density")).toBe("compact");
    expect(html.style.getPropertyValue("--radius")).toBe("0.5rem");
    expect(html.hasAttribute("data-queue")).toBe(false);
    expect(html.hasAttribute("data-glass-engine")).toBe(false);
    expect(html.style.getPropertyValue("--toast-offset-bottom")).toBe("");
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

  describe("docked queue flag", () => {
    const queueAttr = () => document.documentElement.getAttribute("data-queue");

    it("leaves the queue closed when nothing is stored (closed is the default)", () => {
      run();
      expect(document.documentElement.hasAttribute("data-queue")).toBe(false);
    });

    it("marks the queue open when the stored flag is true", () => {
      localStorage.setItem("queue_open", "true");
      run();
      expect(queueAttr()).toBe("open");
    });

    it("leaves the attribute off when the user closed the queue", () => {
      localStorage.setItem("queue_open", "false");
      run();
      expect(document.documentElement.hasAttribute("data-queue")).toBe(false);
    });

    it("never throws when storage is unavailable", () => {
      const original = Object.getOwnPropertyDescriptor(
        globalThis,
        "localStorage",
      );
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        get() {
          throw new Error("blocked");
        },
      });
      try {
        expect(run).not.toThrow();
      } finally {
        if (original)
          Object.defineProperty(globalThis, "localStorage", original);
      }
    });
  });
});
