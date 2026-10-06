import { describe, expect, it } from "bun:test";

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("player a11y (UI-26)", () => {
  // Announcing track changes and naming slider values is covered by rendered
  // tests: apps/web/tests/dom/player-renders.test.tsx ("player a11y").
  it("queue pluralizes the track count and restores focus on removal", async () => {
    const source = await read("../components/queue.tsx");

    // Count text ("1 Track" / "N Tracks") and focus restoration are covered by
    // a rendered test: apps/web/tests/dom/queue-sheet.test.tsx. The remove
    // hook stays a source contract because the behavior tests select by it.
    expect(source).toContain("data-queue-remove");
  });
});

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

    expect(source).toContain(
      "Number((item as ShowDetails).more_info.season_number)",
    );
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
