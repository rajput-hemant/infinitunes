import { describe, expect, it } from "bun:test";

const SEARCH_MENU = new URL(
  "../components/search/search-menu.tsx",
  import.meta.url,
);

describe("search menu dialog", () => {
  it("uses a palette-width dialog shell without the old input row", async () => {
    const source = await Bun.file(SEARCH_MENU).text();

    expect(source).toContain("sm:max-w-2xl");
    expect(source).toContain("data-search-palette");
    expect(source).not.toContain('className="h-10 w-full pl-8"');
  });

  it("shows the searchbox trigger copy from the mockup on large screens", async () => {
    const source = await Bun.file(SEARCH_MENU).text();

    expect(source).toContain("Songs, albums, artists...");
    expect(source).toContain("searchboxTrigger");
    expect(source).not.toContain("lg:w-10 lg:justify-center");
  });
});
