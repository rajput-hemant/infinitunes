import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const globals = readFileSync(
  new URL("../styles/globals.css", import.meta.url),
  "utf8",
);
const presets = readFileSync(
  new URL("../styles/themes.css", import.meta.url),
  "utf8",
);
type Tokens = Record<string, string>;

function tokens(css: string, selector: string): Tokens {
  const block = [
    ...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].find(([, selectors]) => selectors?.trim() === selector);
  if (!block) throw new Error(`Missing selector ${selector}`);
  return Object.fromEntries(
    [...(block[2] ?? "").matchAll(/--([\w-]+):\s*([^;]+);/g)].map(
      ([, name, value]) => [name, value?.trim()],
    ),
  );
}

function luminance(value: string, palette: Tokens): number {
  const alias = /^var\(--([\w-]+)\)$/.exec(value);
  if (alias) return luminance(palette[alias[1]!]!, palette);
  const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!match) throw new Error(`Unsupported color ${value}`);
  const lightness = Number(match[1]);
  const chroma = Number(match[2]);
  const hue = (Number(match[3]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  // OKLab to linear sRGB; clip channels to the display gamut before WCAG luminance.
  const clip = (channel: number) => Math.max(0, Math.min(1, channel));
  return (
    0.2126 * clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) +
    0.7152 * clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) +
    0.0722 * clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  );
}

function contrast(first: string, second: string, palette: Tokens): number {
  const a = luminance(first, palette);
  const b = luminance(second, palette);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const names = [...presets.matchAll(/^\.theme-([\w-]+) \{/gm)].map(
  ([, name]) => name!,
);
const surfaces = [
  "primary",
  "secondary",
  "muted",
  "accent",
  "card",
  "popover",
  "destructive",
  "sidebar",
  "sidebar-primary",
  "sidebar-accent",
];

describe("theme contrast", () => {
  test("WCAG conversion matches black and white", () => {
    expect(contrast("oklch(0 0 0)", "oklch(1 0 0)", {})).toBeCloseTo(21, 5);
    expect(luminance("oklch(0.5 0 0)", {})).toBeCloseTo(0.125, 5);
  });

  for (const name of ["default", ...names]) {
    for (const mode of ["light", "dark"]) {
      test(`${name} ${mode} text pairs clear 4.5:1`, () => {
        const palette = {
          ...tokens(globals, ":root"),
          ...(mode === "dark" ? tokens(globals, ".dark") : {}),
          ...(name !== "default" ? tokens(presets, `.theme-${name}`) : {}),
          ...(name !== "default" && mode === "dark"
            ? tokens(presets, `.dark .theme-${name}`)
            : {}),
        };
        for (const surface of surfaces) {
          const ratio = contrast(
            palette[surface]!,
            palette[`${surface}-foreground`]!,
            palette,
          );
          expect(
            ratio,
            `${name} ${mode} ${surface}: ${ratio.toFixed(2)}:1`,
          ).toBeGreaterThanOrEqual(4.5);
        }
        expect(
          contrast(palette.background!, palette.foreground!, palette),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  for (const name of ["default", ...names]) {
    test(`${name} dark card and popover are lifted above background`, () => {
      const palette = {
        ...tokens(globals, ":root"),
        ...tokens(globals, ".dark"),
        ...(name !== "default"
          ? {
              ...tokens(presets, `.theme-${name}`),
              ...tokens(presets, `.dark .theme-${name}`),
            }
          : {}),
      };
      const lightness = (token: string) =>
        Number(/^oklch\(([\d.]+)/.exec(palette[token]!)![1]);
      for (const surface of ["card", "popover"]) {
        expect(
          lightness(surface) - lightness("background"),
          `${name} dark ${surface}`,
        ).toBeGreaterThanOrEqual(0.04);
      }
    });
  }

  test("presets declare local sidebar aliases and inherit the shared radius", () => {
    expect(names.length).toBe(12);
    expect(tokens(globals, ":root").radius).toBe("0.625rem");
    for (const name of names) {
      for (const selector of [`.theme-${name}`, `.dark .theme-${name}`]) {
        const palette = tokens(presets, selector);
        expect(palette.radius).toBeUndefined();
        expect(palette.sidebar).toBe(
          selector.startsWith(".dark") ? "var(--card)" : "var(--muted)",
        );
        for (const surface of [
          "primary",
          "primary-foreground",
          "accent",
          "accent-foreground",
          "border",
          "ring",
        ]) {
          expect(palette[`sidebar-${surface}`]).toBe(`var(--${surface})`);
        }
      }
    }
    expect(globals).toContain(
      "--color-destructive-foreground: var(--destructive-foreground)",
    );
    expect(globals).toContain("@apply bg-primary text-primary-foreground");
  });
});
