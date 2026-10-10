import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

import { FONT_IDS, HEADING_FONT_IDS } from "@infinitunes/types";

import { DEFAULT_ACCENT, DEFAULT_ACCENT_HEX, themes } from "~/config/themes";
import { deriveAccentTokens } from "~/lib/theme/accent";
import { FONT_FACES } from "~/lib/theme/fonts";
import { normalizeHex } from "~/lib/theme/oklch";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");
const globals = read("../styles/globals.css");
const fonts = read("../lib/fonts.ts");

// The 12 accents of the approved mockup (design-mockups/shared/data.js).
const MOCKUP_PRESETS = {
  zinc: "#18181b",
  slate: "#0f172a",
  stone: "#1c1917",
  gray: "#111827",
  neutral: "#171717",
  red: "#dc2626",
  rose: "#e11d48",
  orange: "#f97316",
  green: "#16a34a",
  blue: "#2563eb",
  yellow: "#facc15",
  violet: "#7c3aed",
};

describe("accent presets", () => {
  it("are the mockup's twelve, with its hex values", () => {
    expect(
      Object.fromEntries(themes.map(({ name, hex }) => [name, hex])),
    ).toEqual(MOCKUP_PRESETS);
    expect(themes).toHaveLength(12);
  });

  it("have labels and valid hex values", () => {
    for (const { name, label, hex } of themes) {
      expect(label.toLowerCase()).toBe(name);
      expect(normalizeHex(hex)).toBe(hex);
    }
  });

  it("make rose the default", () => {
    expect(DEFAULT_ACCENT).toBe("rose");
    expect(themes.find((theme) => theme.name === DEFAULT_ACCENT)?.hex).toBe(
      DEFAULT_ACCENT_HEX,
    );
  });

  it("all go through the same derivation and differ only by accent", () => {
    const seen = new Set<string>();
    for (const { hex } of themes) {
      const { light, dark } = deriveAccentTokens(hex);
      expect(light.primary).toMatch(/^oklch\(/);
      expect(dark.primary).toMatch(/^oklch\(/);
      seen.add(`${light.primary}|${dark.primary}`);
    }
    // The five neutrals share one dark accent but keep their own light one.
    expect(seen.size).toBe(12);
  });

  it("no longer ship per-preset palettes", () => {
    expect(existsSync(new URL("../styles/themes.css", import.meta.url))).toBe(
      false,
    );
    expect(globals).not.toMatch(/\.theme-[a-z]+\s*\{/);
  });
});

describe("font switching", () => {
  it("every font has a face and a CSS mapping to the variable next/font defines", () => {
    for (const id of HEADING_FONT_IDS) {
      const { family } = FONT_FACES[id];
      const variable = /var\((--[\w-]+)\)/.exec(family)![1]!;
      expect(fonts, `${id} font variable`).toContain(`variable: "${variable}"`);
    }
    for (const id of FONT_IDS) {
      const rule = new RegExp(
        `\\[data-font="${id}"\\]\\s*\\{\\s*--font-sans:\\s*${FONT_FACES[id].family.replace(/[()]/g, "\\$&")};`,
      );
      // `system` is the stylesheet default, so it needs no selector.
      if (id === "system")
        expect(globals).toContain("--font-sans: var(--font-inter);");
      else expect(globals, `${id} interface font`).toMatch(rule);
    }
    for (const id of HEADING_FONT_IDS) {
      const rule = new RegExp(
        `\\[data-heading-font="${id}"\\]\\s*\\{\\s*--font-heading:\\s*${FONT_FACES[id].family.replace(/[()]/g, "\\$&")};`,
      );
      if (id === "display")
        expect(globals).toContain("--font-heading: var(--font-cal-sans);");
      else expect(globals, `${id} heading font`).toMatch(rule);
    }
  });

  it("preloads only the default faces", () => {
    for (const face of [
      "Nunito",
      "Hanken_Grotesk",
      "Source_Serif_4",
      "JetBrains_Mono",
    ]) {
      const block =
        new RegExp(`${face}\\(\\{[^}]*\\}\\)`).exec(fonts)?.[0] ?? "";
      expect(block, face).toContain("preload: false");
    }
    for (const face of ["Inter", "Noto_Sans_Devanagari"]) {
      const block =
        new RegExp(`${face}\\(\\{[^}]*\\}\\)`).exec(fonts)?.[0] ?? "";
      expect(block, face).not.toContain("preload: false");
    }
  });

  it("swaps every face and keeps the Devanagari fallback in the stacks", () => {
    expect(fonts.match(/display: "swap"/g)).toHaveLength(7);
    expect(globals).toMatch(
      /--font-sans:\s*var\(--font-sans\),\s*var\(--font-sans-devanagari\)/,
    );
    expect(globals).toMatch(
      /--font-heading:\s*var\(--font-heading\),\s*var\(--font-sans-devanagari\)/,
    );
  });
});
