import { describe, expect, it } from "bun:test";

const SEARCH_MENU = new URL("../components/search/search-menu.tsx", import.meta.url);

describe("search menu dialog", () => {
  it("overrides stock sm max width and uses h-10 search input", async () => {
    const source = await Bun.file(SEARCH_MENU).text();

    expect(source).toContain("sm:max-w-7xl");
    expect(source).toContain('className="h-10 w-full pl-8"');
  });
});
