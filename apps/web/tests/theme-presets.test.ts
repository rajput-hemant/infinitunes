import { describe, expect, it } from "bun:test";

import { themes } from "~/config/themes";

const THEMES_CSS = new URL("../styles/themes.css", import.meta.url);

describe("theme presets css", () => {
  it("defines a css block for every theme in config/themes.ts", async () => {
    const source = await Bun.file(THEMES_CSS).text();

    for (const { name } of themes) {
      expect(source).toContain(`.theme-${name} {`);
      expect(source).toContain(`.dark .theme-${name} {`);
      const lightBlock = source.match(
        new RegExp(`\\.theme-${name}\\s*\\{([^}]+)\\}`),
      );
      expect(lightBlock?.[1]?.trim().length).toBeGreaterThan(0);
    }
  });
});
