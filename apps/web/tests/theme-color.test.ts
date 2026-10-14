import { describe, expect, it } from "bun:test";

import { THEME_COLOR } from "~/lib/theme-color";

const GLOBALS_CSS = new URL("../styles/globals.css", import.meta.url);
const MOCKUP_BACKGROUND = { light: "#f5f5f7", dark: "#0b0b0c" };

function backgroundHex(source: string, selector: string) {
  const block = source.match(new RegExp(`^${selector} \\{([^}]+)\\}`, "m"));
  const value = block?.[1]?.match(/--background:\s*(#[0-9a-f]{6});/i);
  if (!value) throw new Error(`no hex --background in ${selector}`);
  return value[1]!.toLowerCase();
}

describe("theme-color", () => {
  it("matches the default --background token in each scheme", async () => {
    const source = await Bun.file(GLOBALS_CSS).text();

    expect(backgroundHex(source, ":root")).toBe(THEME_COLOR.light);
    expect(backgroundHex(source, "\\.dark")).toBe(THEME_COLOR.dark);
  });

  it("tracks the approved mockup surfaces", () => {
    expect(THEME_COLOR).toEqual(MOCKUP_BACKGROUND);
  });
});
