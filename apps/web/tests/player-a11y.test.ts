import { describe, expect, it } from "bun:test";

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("PlayButton season (PQ-4)", () => {
  it("takes the season as a prop instead of parsing the pathname", async () => {
    const source = await read("../components/play-button.tsx");

    expect(source).not.toContain("usePathname");
    expect(source).not.toContain("as unknown as");
    expect(source).toContain("season?: number;");
  });

  it("details header passes the show's season", async () => {
    const source = await read(
      "../components/details-header/details-header.tsx",
    );

    expect(source).toContain('isKind(item, "season")');
    expect(source).toContain("Number(item.more_info.season_number)");
  });
});

describe("PlaylistItem cover failure (CD-5)", () => {
  it("degrades to the placeholder and logs", async () => {
    const source = await read(
      "../app/(root)/me/(layout-a)/_components/playlist-item.tsx",
    );

    expect(source).toContain("catch (error)");
    expect(source).toContain("console.error(");
  });
});
