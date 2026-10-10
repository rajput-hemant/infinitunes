import { describe, expect, it } from "bun:test";

import { THEME_COLOR } from "~/lib/theme-color";

const GLOBALS_CSS = new URL("../styles/globals.css", import.meta.url);

// oklch to an sRGB hex, clipped to the display gamut.
function oklchHex(lightness: number, chroma: number, hueDegrees: number) {
  const hue = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const channels = linear.map((value) => {
    const clipped = Math.max(0, Math.min(1, value));
    const srgb =
      clipped <= 0.0031308
        ? 12.92 * clipped
        : 1.055 * clipped ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function backgroundHex(source: string, selector: string) {
  const block = source.match(new RegExp(`^${selector} \\{([^}]+)\\}`, "m"));
  const value = block?.[1]?.match(
    /--background:\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/,
  );
  if (!value) throw new Error(`no oklch --background in ${selector}`);
  return oklchHex(Number(value[1]), Number(value[2]), Number(value[3]));
}

describe("theme-color", () => {
  it("matches the default --background token in each scheme", async () => {
    const source = await Bun.file(GLOBALS_CSS).text();

    expect(backgroundHex(source, ":root")).toBe(THEME_COLOR.light);
    expect(backgroundHex(source, "\\.dark")).toBe(THEME_COLOR.dark);
  });
});
