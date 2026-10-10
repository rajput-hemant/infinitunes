import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { DEFAULT_ACCENT_HEX, themes } from "~/config/themes";
import {
  AA_CONTRAST,
  SURFACES,
  accentVariables,
  deriveAccentTokens,
} from "~/lib/theme/accent";
import type { Scheme } from "~/lib/theme/accent";
import {
  colorLuminance,
  contrastRatio,
  formatOklch,
  hexLuminance,
  hexToOklch,
  normalizeHex,
} from "~/lib/theme/oklch";

const globals = readFileSync(
  new URL("../styles/globals.css", import.meta.url),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

type Tokens = Record<string, string>;

function declarations(body: string): Tokens {
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value?.trim(),
    ]),
  );
}

/** Variables declared by the first `selector { ... }` rule at or after `from`. */
function tokens(selector: string, from = 0): Tokens {
  for (const [, selectors, body] of globals
    .slice(from)
    .matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors?.trim() === selector) return declarations(body ?? "");
  }
  throw new Error(`Missing selector ${selector}`);
}

function palette(scheme: Scheme, contrastMore = false): Tokens {
  const more = globals.indexOf("@media (prefers-contrast: more)");
  return {
    ...tokens(":root"),
    ...(contrastMore ? tokens(":root", more) : {}),
    ...(scheme === "dark" ? tokens(".dark") : {}),
    ...(scheme === "dark" && contrastMore ? tokens(".dark", more) : {}),
  };
}

function resolve(value: string, scheme: Scheme, contrastMore = false): string {
  const all = palette(scheme, contrastMore);
  let current = value;
  for (let depth = 0; depth < 8; depth++) {
    const alias = /^var\(--([\w-]+)\)$/.exec(current);
    if (!alias) return current;
    const next = all[alias[1]!];
    if (next === undefined) throw new Error(`Unresolved ${current}`);
    current = next;
  }
  throw new Error(`Alias loop at ${value}`);
}

function ratio(first: string, second: string, scheme: Scheme, more = false) {
  return contrastRatio(
    colorLuminance(resolve(first, scheme, more)),
    colorLuminance(resolve(second, scheme, more)),
  );
}

function token(name: string) {
  return `var(--${name})`;
}

const SCHEMES: Scheme[] = ["light", "dark"];

// Deterministic spread of the sRGB cube: every 51st level plus a seeded scatter.
function sweep(): string[] {
  const hexes: string[] = [];
  for (let r = 0; r <= 255; r += 51)
    for (let g = 0; g <= 255; g += 51)
      for (let b = 0; b <= 255; b += 51)
        hexes.push(
          `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`,
        );
  let seed = 0x2f6e2b1;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let i = 0; i < 400; i++) {
    hexes.push(`#${(next() >>> 8).toString(16).padStart(6, "0")}`);
  }
  return hexes;
}

describe("accent derivation", () => {
  test("WCAG conversion matches black, white and mid grey", () => {
    expect(
      contrastRatio(colorLuminance("#000000"), colorLuminance("#ffffff")),
    ).toBeCloseTo(21, 5);
    expect(colorLuminance("oklch(0 0 0)")).toBeCloseTo(0, 5);
    expect(colorLuminance("oklch(1 0 0)")).toBeCloseTo(1, 3);
    expect(colorLuminance("oklch(0.5 0 0)")).toBeCloseTo(0.125, 2);
  });

  function assertAccessible(hex: string) {
    const derived = deriveAccentTokens(hex);
    for (const scheme of SCHEMES) {
      const { primary, primaryForeground, accent } = derived[scheme];
      const primaryLuminance = colorLuminance(primary);
      for (const surface of Object.values(SURFACES[scheme])) {
        expect(
          contrastRatio(primaryLuminance, hexLuminance(surface)),
          `${hex} ${scheme} primary on ${surface}`,
        ).toBeGreaterThanOrEqual(AA_CONTRAST);
      }
      expect(
        contrastRatio(primaryLuminance, colorLuminance(primaryForeground)),
        `${hex} ${scheme} text on primary`,
      ).toBeGreaterThanOrEqual(AA_CONTRAST);
      expect(
        contrastRatio(
          colorLuminance(accent),
          colorLuminance(resolve(token("foreground"), scheme)),
        ),
        `${hex} ${scheme} text on accent tint`,
      ).toBeGreaterThanOrEqual(AA_CONTRAST);
    }
  }

  test("every preset clears AA on both surfaces and for its own text", () => {
    for (const { hex } of themes) assertAccessible(hex);
  });

  test("any accent clears AA: a sweep of the sRGB cube", () => {
    for (const hex of sweep()) assertAccessible(hex);
  });

  test("extremes still resolve", () => {
    for (const hex of [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
    ]) {
      assertAccessible(hex);
    }
  });

  test("a colour that already passes is not moved", () => {
    const yellow = deriveAccentTokens("#facc15");
    expect(yellow.dark.primary).toBe(formatOklch(hexToOklch("#facc15")));
  });

  test("hue and chroma survive; only lightness moves", () => {
    const light = deriveAccentTokens("#e11d48").light.primary;
    const dark = deriveAccentTokens("#e11d48").dark.primary;
    const hue = (value: string) => Number(/ ([\d.]+)\)$/.exec(value)![1]);
    expect(hue(light)).toBe(hue(dark));
    expect(hue(light)).toBeGreaterThan(10);
    expect(hue(light)).toBeLessThan(25);
  });

  test("a very dark accent flips to a light neutral in dark mode", () => {
    for (const name of ["zinc", "slate", "stone", "gray", "neutral"]) {
      const hex = themes.find((theme) => theme.name === name)!.hex;
      const { light, dark } = deriveAccentTokens(hex);
      expect(colorLuminance(dark.primary)).toBeGreaterThan(0.85);
      expect(colorLuminance(light.primary)).toBeLessThan(0.05);
    }
  });

  test("emits one variable per scheme and token", () => {
    expect(Object.keys(accentVariables(deriveAccentTokens("#2563eb")))).toEqual(
      [
        "--light-primary",
        "--light-primary-foreground",
        "--light-accent",
        "--dark-primary",
        "--dark-primary-foreground",
        "--dark-accent",
      ],
    );
  });
});

describe("shipped tokens", () => {
  test("SURFACES mirror --background and --card", () => {
    for (const scheme of SCHEMES) {
      expect(normalizeHex(resolve(token("background"), scheme))).toBe(
        SURFACES[scheme].background,
      );
      expect(normalizeHex(resolve(token("card"), scheme))).toBe(
        SURFACES[scheme].card,
      );
    }
  });

  test("the stylesheet defaults are the derived default accent", () => {
    const derived = accentVariables(deriveAccentTokens(DEFAULT_ACCENT_HEX));
    const defaults = tokens(":root");
    for (const [name, value] of Object.entries(derived)) {
      expect(defaults[name.slice(2)], name).toBe(value);
    }
  });

  const textPairs: [string, string][] = [
    ["foreground", "background"],
    ["foreground", "card"],
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["secondary-foreground", "secondary"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    ["muted-foreground", "muted"],
    ["primary-foreground", "primary"],
    ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"],
    ["sidebar-foreground", "sidebar"],
    ["sidebar-primary-foreground", "sidebar-primary"],
    ["sidebar-accent-foreground", "sidebar-accent"],
  ];

  for (const scheme of SCHEMES) {
    for (const more of [false, true]) {
      test(`${scheme}${more ? " with prefers-contrast: more" : ""}: text pairs clear 4.5:1`, () => {
        for (const [foreground, background] of textPairs) {
          expect(
            ratio(token(foreground), token(background), scheme, more),
            `${foreground} on ${background}`,
          ).toBeGreaterThanOrEqual(AA_CONTRAST);
        }
      });
    }

    test(`${scheme}: input borders clear 3:1 on both surfaces`, () => {
      for (const surface of ["background", "card"]) {
        expect(
          ratio(token("input"), token(surface), scheme),
          surface,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    test(`${scheme}: the default accent as text clears AA on both surfaces`, () => {
      for (const surface of ["background", "card"]) {
        expect(
          ratio(token("primary"), token(surface), scheme),
          surface,
        ).toBeGreaterThanOrEqual(AA_CONTRAST);
      }
    });
  }

  test("dark card and popover sit above the background", () => {
    for (const surface of ["card", "popover"]) {
      expect(
        colorLuminance(resolve(token(surface), "dark")),
        surface,
      ).toBeGreaterThan(colorLuminance(resolve(token("background"), "dark")));
    }
  });

  test("the radius scale derives from one base", () => {
    const root = tokens(":root");
    expect(root.radius).toBe("0.75rem");
    expect(root["r-sm"]).toBe("calc(var(--radius) * 0.66)");
    expect(root["r-lg"]).toBe("calc(var(--radius) * 1.5)");
    expect(root["r-ctl"]).toBe("calc(var(--radius) * 1.5)");
  });

  test("control sizes follow the pointer", () => {
    const fine = tokens(":root");
    const coarse = tokens(":root", globals.indexOf("@media (pointer: coarse)"));
    expect([fine.ctl, fine["ctl-lg"]]).toEqual(["2rem", "2.25rem"]);
    expect([coarse.ctl, coarse["ctl-lg"]]).toEqual(["2.5rem", "2.75rem"]);
  });

  test("density swaps row and artwork sizes", () => {
    const compact = tokens('[data-density="compact"]');
    expect([compact.row, compact.art]).toEqual(["2.5rem", "2rem"]);
    expect([tokens(":root").row, tokens(":root").art]).toEqual([
      "3.25rem",
      "2.5rem",
    ]);
  });

  test("the stylesheet honors the accessibility media queries", () => {
    expect(globals).toContain("@media (prefers-contrast: more)");
    expect(globals).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(globals).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globals).toContain('[data-motion="reduced"]');
  });
});
