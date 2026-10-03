import { describe, expect, it } from "bun:test";

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("mobile shell", () => {
  it("opens the sidebar sheet from a Library item in MobileNav", async () => {
    const source = await read("../components/site-header/mobile-nav.tsx");

    expect(source).toContain("useSidebar");
    expect(source).toContain("setOpenMobile(true)");
    expect(source).toContain("Library");
  });

  it("switches the sidebar to its sheet below lg", async () => {
    const source = await read("../../../packages/ui/src/hooks/use-mobile.ts");

    expect(source).toContain("MOBILE_BREAKPOINT = 1024");
  });

  it("does not nest the mega menu trigger inside a link", async () => {
    const source = await read("../components/site-header/main-nav.tsx");

    expect(source).not.toMatch(/<Link[^>]*>\s*<NavigationMenuTrigger/);
    expect(source).toContain("View all Music");
  });

  it("constrains main content and aligns the header with the sidebar", async () => {
    const layout = await read("../app/(root)/layout.tsx");
    const navbar = await read("../components/site-header/navbar.tsx");

    expect(layout).toContain("max-w-(--breakpoint-2xl)");
    expect(navbar).not.toContain('className="container');
  });
});

describe("headings", () => {
  it("use the foreground token instead of a dark-mode gradient", async () => {
    const glob = new Bun.Glob("**/*.tsx");
    const root = new URL("../", import.meta.url).pathname;
    const offenders: string[] = [];

    for await (const file of glob.scan({ cwd: root })) {
      if (file.startsWith("node_modules") || file.startsWith(".next")) continue;
      // queue.tsx is owned by the player work and migrates separately.
      if (file === "components/queue.tsx") continue;
      const source = await Bun.file(root + file).text();
      if (source.includes("dark:from-neutral-200")) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });
});
