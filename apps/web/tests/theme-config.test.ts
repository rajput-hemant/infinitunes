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
  accent: "#3a7bd5",
  radius: 1.25,
  font: "serif",
  headingFont: "mono",
  textSize: 18,
  density: "compact",
  glass: "solid",
  ambient: false,
  reduceMotion: true,
  glassTuning: {
    variant: "tinted",
    tint: 0.5,
    blur: 10,
    refraction: 20,
    sat: 2.0,
    spec: 0.5,
    shadow: 0.5,
    ambientLevel: 0.5,
    accentTint: true,
  },
};

describe("parseThemeConfig", () => {
  test("uses defaults when the cookie is absent", () => {
    expect(parseThemeConfig(undefined)).toEqual(DEFAULT_THEME_CONFIG);
    expect(parseThemeConfig("")).toEqual(DEFAULT_THEME_CONFIG);
  });

  test("defaults are the approved design", () => {
    expect(DEFAULT_THEME_CONFIG).toEqual({
      accent: "rose",
      radius: 0.75,
      font: "system",
      headingFont: "display",
      textSize: 16,
      density: "comfortable",
      glass: "liquid",
      ambient: true,
      reduceMotion: false,
      glassTuning: {
        variant: "regular",
        tint: null,
        blur: 3,
        refraction: 30,
        sat: 1.8,
        spec: 1,
        shadow: 1,
        ambientLevel: 0.62,
        accentTint: false,
      },
    });
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
        '{"accent":"blue","radius":"huge","font":"comic","textSize":99,"density":1}',
      ),
    ).toEqual({ ...DEFAULT_THEME_CONFIG, accent: "blue" });
  });

  test("migrates the cookie the old appearance page wrote", () => {
    expect(parseThemeConfig('{"theme":"violet","radius":0.5}')).toEqual({
      ...DEFAULT_THEME_CONFIG,
      accent: "violet",
      radius: 0.5,
    });
    expect(parseThemeConfig('{"theme":"default","radius":"default"}')).toEqual(
      DEFAULT_THEME_CONFIG,
    );
  });

  test("prefers accent over the legacy theme key", () => {
    expect(parseThemeConfig('{"accent":"green","theme":"blue"}').accent).toBe(
      "green",
    );
  });

  test("normalizes custom accent hex and rejects anything else", () => {
    expect(normalizeThemeConfig({ accent: "#ABC" }).accent).toBe("#aabbcc");
    expect(normalizeThemeConfig({ accent: " #1A2B3C " }).accent).toBe(
      "#1a2b3c",
    );
    expect(normalizeThemeConfig({ accent: " Rose " }).accent).toBe("rose");
    for (const accent of [
      "#12345",
      "#1234567",
      "#gggggg",
      "crimson",
      "rgb(0,0,0)",
      "url(javascript:alert(1))",
      "#fff; --radius: 0",
      "}</style><script>",
      7,
      null,
      {},
    ]) {
      expect(normalizeThemeConfig({ accent }).accent).toBe("rose");
    }
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
    expect(normalizeThemeConfig({ ambient: "no" }).ambient).toBe(true);
    expect(normalizeThemeConfig({ reduceMotion: 1 }).reduceMotion).toBe(false);
  });

  test("ignores inherited and prototype keys", () => {
    const polluted = JSON.parse(
      '{"__proto__":{"accent":"blue"},"font":"mono"}',
    );
    expect(normalizeThemeConfig(polluted)).toEqual({
      ...DEFAULT_THEME_CONFIG,
      font: "mono",
    });
    expect(Object.hasOwn(Object.prototype, "accent")).toBe(false);
    expect(normalizeThemeConfig(Object.create({ accent: "blue" }))).toEqual(
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
      { accent: "orange" },
      { accent: "#010203" },
      { radius: 0 },
      { radius: 1.5 },
      { font: "rounded" },
      { headingFont: "system" },
      { textSize: 15 },
      { density: "compact" },
      { glass: "subtle" },
      { ambient: false },
      { reduceMotion: true },
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
      "data-glass": "liquid",
      "data-ambient": "on",
      "data-motion": "full",
      "data-font": "system",
      "data-heading-font": "display",
    });
  });

  test("maps every option onto an attribute", () => {
    expect(themeConfigToHtml(everyField).attributes).toEqual({
      "data-density": "compact",
      "data-glass": "solid",
      "data-ambient": "off",
      "data-motion": "reduced",
      "data-font": "serif",
      "data-heading-font": "mono",
      "data-glass-variant": "tinted",
      "data-glass-accent-tint": "true",
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

  test("emits both schemes of a custom accent, and none for the default", () => {
    const { style } = themeConfigToHtml({
      ...DEFAULT_THEME_CONFIG,
      accent: "blue",
    });
    expect(Object.keys(style).toSorted()).toEqual([
      "--dark-accent",
      "--dark-primary",
      "--dark-primary-foreground",
      "--light-accent",
      "--light-primary",
      "--light-primary-foreground",
    ]);
    for (const value of Object.values(style)) {
      expect(value).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
    }
  });

  test("only ever emits values drawn from validated config", () => {
    const hostile = normalizeThemeConfig({
      accent: "#fff; background: url(//evil)",
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
});
