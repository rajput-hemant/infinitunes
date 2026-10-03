import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";

const read = (p: string) =>
  readFile(new URL(`../${p}`, import.meta.url), "utf8");

describe("upstream strings are decoded", () => {
  it("slider-card decodes name and subtitle", async () => {
    const src = await read("components/slider/slider-card.tsx");
    expect(src).toContain("decode(rawName)");
    expect(src).toContain("decode(rawSubtitle)");
  });

  it("search-all and top-search decode title and subtitle", async () => {
    for (const f of [
      "components/search/search-all.tsx",
      "components/search/top-search.tsx",
    ]) {
      const src = await read(f);
      expect(src).toContain("decode(t.title)");
      expect(src).toContain("decode(t.subtitle)");
      expect(src).not.toMatch(/alt=\{t\.title\}/);
    }
  });
});
