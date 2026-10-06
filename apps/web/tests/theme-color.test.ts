import { describe, expect, it } from "bun:test";

import { THEME_COLOR } from "~/lib/theme-color";

const GLOBALS_CSS = new URL("../styles/globals.css", import.meta.url);

// Achromatic oklch (chroma 0) to an sRGB hex.
function grayHex(lightness: number) {
  const linear = lightness ** 3;
  const srgb =
    linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  const channel = Math.round(srgb * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${channel.repeat(3)}`;
}

function backgroundLightness(source: string, selector: string) {
  const block = source.match(new RegExp(`^${selector} \\{([^}]+)\\}`, "m"));
  const value = block?.[1]?.match(/--background:\s*oklch\(([\d.]+) 0 0\)/);
  return Number(value?.[1]);
}

describe("theme-color", () => {
  it("matches the default --background token in each scheme", async () => {
    const source = await Bun.file(GLOBALS_CSS).text();

    expect(grayHex(backgroundLightness(source, ":root"))).toBe(
      THEME_COLOR.light,
    );
    expect(grayHex(backgroundLightness(source, "\\.dark"))).toBe(
      THEME_COLOR.dark,
    );
  });
});
