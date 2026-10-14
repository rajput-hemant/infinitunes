import { describe, expect, test } from "bun:test";

import {
  DENSITIES,
  FONT_IDS,
  GLASS_LEVELS,
  HEADING_FONT_IDS,
  TEXT_SIZES,
} from "@infinitunes/types";
import type { ThemeConfig } from "@infinitunes/types";

import {
  DEFAULT_THEME_CONFIG,
  isDefaultThemeConfig,
  normalizeThemeConfig,
  parseThemeConfig,
  serializeThemeConfig,
} from "~/lib/theme-config";
import { applyThemeConfig, themeConfigToHtml } from "~/lib/theme/html";
import type { ThemeTarget } from "~/lib/theme/html";

const everyField: ThemeConfig = {
  radius: 1.25,
  font: "serif",
  headingFont: "mono",
  textSize: 18,
  density: "compact",
  glass: "solid",
  reduceMotion: true,
  glassTuning: {
    depth: 90,
    splay: 12,
    feather: 30,
    curve: 1.4,
    blur: 2.5,
    chroma: 0.1,
    glint: 80,
    tint: 0.5,
    tintColor: "#3a7bd5",
  },
};

describe("parseThemeConfig", () => {
  test("uses defaults when the cookie is absent", () => {
    expect(parseThemeConfig(undefined)).toEqual(DEFAULT_THEME_CONFIG);
    expect(parseThemeConfig("")).toEqual(DEFAULT_THEME_CONFIG);
  });

  test("defaults are the approved design", () => {
    expect(DEFAULT_THEME_CONFIG).toEqual({
      radius: 0.75,
      font: "system",
      headingFont: "display",
      textSize: 16,
      density: "comfortable",
      glass: "liquid",
      reduceMotion: false,
      glassTuning: {
        depth: 60,
        splay: 2,
        feather: 24,
        curve: 2,
        blur: 0,
        chroma: 0,
        glint: 25,
        tint: 0,
        tintColor: "#ffffff",
      },
    });
  });

  test("keeps a fully clear glass tint", () => {
    const raw = JSON.stringify({
      glassTuning: { ...DEFAULT_THEME_CONFIG.glassTuning, tint: 0 },
    });
    expect(parseThemeConfig(raw).glassTuning.tint).toBe(0);
  });

  test("falls back on malformed JSON instead of throwing", () => {
    for (const raw of ["{not json", "{", "undefined", "\u0000", '{"a":']) {
      expect(parseThemeConfig(raw)).toEqual(DEFAULT_THEME_CONFIG);
    }
  });

  test("falls back on JSON of the wrong shape", () => {
    for (const raw of ["null", "42", '"x"', "[]", "true", "[1,2]"]) {
      expect(parseThemeConfig(raw)).toEqual(DEFAULT_THEME_CONFIG);
    }
  });

  test("falls back per field and keeps the valid ones", () => {
    expect(
      parseThemeConfig(
        '{"density":"compact","radius":"huge","font":"comic","textSize":99}',
      ),
    ).toEqual({ ...DEFAULT_THEME_CONFIG, density: "compact" });
  });

  test("ignores keys the model no longer has", () => {
    expect(
      parseThemeConfig(
        '{"theme":"violet","accent":"blue","ambient":false,"radius":0.5}',
      ),
    ).toEqual({ ...DEFAULT_THEME_CONFIG, radius: 0.5 });
  });

  test("migrates a cookie written with the old glass tuning", () => {
    const old = {
      glassTuning: {
        variant: "clear",
        tint: null,
        blur: 12,
        refraction: 30,
        sat: 1.8,
        spec: 1,
        shadow: 1,
        ambientLevel: 0.62,
        accentTint: true,
      },
    };
    const { glassTuning } = normalizeThemeConfig(old);
    // Unknown fields vanish, a field that still exists is clamped into its new range, and `tint: null` is the default.
    expect(glassTuning).toEqual({
      ...DEFAULT_THEME_CONFIG.glassTuning,
      blur: 5,
    });
  });

  test("accepts any radius from 0 to 24px and nothing outside it", () => {
    for (const radius of [0, 0.3, 0.5, 0.75, 1, 1.5, 0.3125]) {
      expect(normalizeThemeConfig({ radius }).radius).toBe(radius);
    }
    for (const radius of [
      -0.1,
      1.6,
      99,
      Number.NaN,
      "0.5",
      null,
      [0.5],
      Number.POSITIVE_INFINITY,
    ]) {
      expect(normalizeThemeConfig({ radius }).radius).toBe(0.75);
    }
  });

  test("accepts every listed option and only those", () => {
    for (const font of FONT_IDS) {
      expect(normalizeThemeConfig({ font }).font).toBe(font);
    }
    for (const headingFont of HEADING_FONT_IDS) {
      expect(normalizeThemeConfig({ headingFont }).headingFont).toBe(
        headingFont,
      );
    }
    for (const textSize of TEXT_SIZES) {
      expect(normalizeThemeConfig({ textSize }).textSize).toBe(textSize);
    }
    for (const density of DENSITIES) {
      expect(normalizeThemeConfig({ density }).density).toBe(density);
    }
    for (const glass of GLASS_LEVELS) {
      expect(normalizeThemeConfig({ glass }).glass).toBe(glass);
    }
    expect(normalizeThemeConfig({ font: "display" }).font).toBe("system");
    expect(normalizeThemeConfig({ textSize: "17" }).textSize).toBe(16);
    expect(normalizeThemeConfig({ glass: "off" }).glass).toBe("liquid");
    expect(normalizeThemeConfig({ reduceMotion: 1 }).reduceMotion).toBe(false);
  });

  test("ignores inherited and prototype keys", () => {
    const polluted = JSON.parse('{"__proto__":{"radius":1},"font":"mono"}');
    expect(normalizeThemeConfig(polluted)).toEqual({
      ...DEFAULT_THEME_CONFIG,
      font: "mono",
    });
    expect(Object.hasOwn(Object.prototype, "radius")).toBe(false);
    expect(normalizeThemeConfig(Object.create({ radius: 1 }))).toEqual(
      DEFAULT_THEME_CONFIG,
    );
  });

  test("never throws on arbitrary input", () => {
    const hostile: unknown[] = [
      undefined,
      null,
      Symbol("x"),
      () => 1,
      new Date(),
      new Map(),
      Object.create(null),
    ];
    for (const value of hostile) {
      expect(() => normalizeThemeConfig(value)).not.toThrow();
    }
    expect(() => parseThemeConfig("x".repeat(100_000))).not.toThrow();
  });
});

describe("serializeThemeConfig", () => {
  test("a default config serializes to nothing and is detected as default", () => {
    expect(serializeThemeConfig(DEFAULT_THEME_CONFIG)).toBe("{}");
    expect(isDefaultThemeConfig(DEFAULT_THEME_CONFIG)).toBe(true);
    expect(isDefaultThemeConfig(everyField)).toBe(false);
  });

  test("stores only the fields that differ", () => {
    expect(
      JSON.parse(
        serializeThemeConfig({ ...DEFAULT_THEME_CONFIG, density: "compact" }),
      ),
    ).toEqual({ density: "compact" });
  });

  test("round trips every field", () => {
    expect(parseThemeConfig(serializeThemeConfig(everyField))).toEqual(
      everyField,
    );
  });

  test("round trips each single change from the defaults", () => {
    const changes: Partial<ThemeConfig>[] = [
      { radius: 0 },
      { radius: 1.5 },
      { font: "rounded" },
      { headingFont: "system" },
      { textSize: 15 },
      { density: "compact" },
      { glass: "subtle" },
      { reduceMotion: true },
      { glassTuning: { ...DEFAULT_THEME_CONFIG.glassTuning, depth: 0 } },
      { glassTuning: { ...DEFAULT_THEME_CONFIG.glassTuning, chroma: 0.25 } },
      {
        glassTuning: {
          ...DEFAULT_THEME_CONFIG.glassTuning,
          tint: 1,
          tintColor: "#ff6600",
        },
      },
    ];
    for (const change of changes) {
      const config = { ...DEFAULT_THEME_CONFIG, ...change };
      expect(parseThemeConfig(serializeThemeConfig(config))).toEqual(config);
    }
  });
});

describe("themeConfigToHtml", () => {
  test("the default config needs no inline style", () => {
    const { attributes, style } = themeConfigToHtml(DEFAULT_THEME_CONFIG);
    expect(style).toEqual({});
    expect(attributes).toEqual({
      "data-density": "comfortable",
      "data-glass-level": "liquid",
      "data-motion": "full",
      "data-font": "system",
      "data-heading-font": "display",
    });
  });

  test("maps every option onto an attribute", () => {
    expect(themeConfigToHtml(everyField).attributes).toEqual({
      "data-density": "compact",
      "data-glass-level": "solid",
      "data-motion": "reduced",
      "data-font": "serif",
      "data-heading-font": "mono",
      "data-glass-tint": "on",
    });
  });

  test("derives radius and text scale as custom properties", () => {
    const { style } = themeConfigToHtml(everyField);
    expect(style["--radius"]).toBe("1.25rem");
    expect(style["--text-scale"]).toBe("1.125");
    expect(
      themeConfigToHtml({ ...DEFAULT_THEME_CONFIG, textSize: 15 }).style,
    ).toEqual({ "--text-scale": "0.9375" });
  });

  test("writes the lens and paint tuning that differs from the defaults", () => {
    const { style } = themeConfigToHtml({
      ...DEFAULT_THEME_CONFIG,
      glassTuning: {
        ...DEFAULT_THEME_CONFIG.glassTuning,
        depth: 90,
        blur: 2.5,
        glint: 80,
      },
    });
    expect(style).toEqual({
      "--glass-depth": "90",
      "--glass-blur": "2.5px",
      "--glass-glint": "0.8",
    });
  });

  test("keeps the neutral primary while the tint is off, whatever the colour", () => {
    const { style, attributes } = themeConfigToHtml({
      ...DEFAULT_THEME_CONFIG,
      glassTuning: {
        ...DEFAULT_THEME_CONFIG.glassTuning,
        tintColor: "#ff6600",
      },
    });
    expect(style).toEqual({ "--glass-tint-c": "#ff6600" });
    expect("data-glass-tint" in attributes).toBe(false);
  });

  test("derives both schemes of the primary from the tint colour once the tint is on", () => {
    const { style, attributes } = themeConfigToHtml({
      ...DEFAULT_THEME_CONFIG,
      glassTuning: {
        ...DEFAULT_THEME_CONFIG.glassTuning,
        tint: 0.6,
        tintColor: "#2563eb",
      },
    });
    expect(attributes["data-glass-tint"]).toBe("on");
    expect(style["--glass-tint"]).toBe("0.6");
    expect(Object.keys(style).toSorted()).toEqual([
      "--dark-accent",
      "--dark-primary",
      "--dark-primary-foreground",
      "--glass-tint",
      "--glass-tint-c",
      "--light-accent",
      "--light-primary",
      "--light-primary-foreground",
    ]);
    expect(style["--light-primary"]).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
  });

  test("only ever emits values drawn from validated config", () => {
    const hostile = normalizeThemeConfig({
      glassTuning: { tintColor: "#fff; background: url(//evil)", depth: "9" },
      font: '"><script>',
      radius: "1rem; color: red",
    });
    const { attributes, style } = themeConfigToHtml(hostile);
    expect(style).toEqual({});
    expect(Object.values(attributes).join(" ")).not.toMatch(/[<>;"]/);
  });
});

function fakeTarget() {
  const attributes = new Map<string, string>();
  const properties = new Map<string, string>();
  const target: ThemeTarget = {
    setAttribute: (name, value) => void attributes.set(name, value),
    removeAttribute: (name) => void attributes.delete(name),
    style: {
      setProperty: (name, value) => void properties.set(name, value),
      removeProperty: (name) => {
        const previous = properties.get(name) ?? "";
        properties.delete(name);
        return previous;
      },
    },
  };
  return { target, attributes, properties };
}

describe("applyThemeConfig", () => {
  test("writes what the server renders", () => {
    const { target, attributes, properties } = fakeTarget();
    applyThemeConfig(target, everyField);
    const { attributes: expected, style } = themeConfigToHtml(everyField);
    expect(Object.fromEntries(attributes)).toEqual(expected);
    expect(Object.fromEntries(properties)).toEqual(style);
  });

  test("a reset clears every property it set before", () => {
    const { target, properties } = fakeTarget();
    applyThemeConfig(target, everyField);
    expect(properties.size).toBeGreaterThan(0);
    applyThemeConfig(target, DEFAULT_THEME_CONFIG);
    expect(properties.size).toBe(0);
  });

  test("changing one field leaves the others in place", () => {
    const { target, properties } = fakeTarget();
    applyThemeConfig(target, { ...DEFAULT_THEME_CONFIG, radius: 0.5 });
    applyThemeConfig(target, {
      ...DEFAULT_THEME_CONFIG,
      radius: 0.5,
      textSize: 17,
    });
    expect(Object.fromEntries(properties)).toEqual({
      "--radius": "0.5rem",
      "--text-scale": "1.0625",
    });
  });

  test("drops the pre-rename data-glass attribute so <html> never reads as a surface", () => {
    const { target, attributes } = fakeTarget();
    target.setAttribute("data-glass", "liquid");
    applyThemeConfig(target, DEFAULT_THEME_CONFIG);
    expect(attributes.has("data-glass")).toBe(false);
    expect(attributes.get("data-glass-level")).toBe("liquid");
  });
});
