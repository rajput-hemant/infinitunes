import { describe, expect, it } from "bun:test";

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("mobile shell", () => {
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
      const source = await Bun.file(root + file).text();
      if (source.includes("dark:from-neutral-200")) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });
});

describe("landmarks", () => {
  it("renders a single main landmark: SidebarInset, with the skip-link id", async () => {
    const layout = await read("../app/(root)/layout.tsx");
    const glob = new Bun.Glob("app/**/*.tsx");
    const root = new URL("../", import.meta.url).pathname;
    const nested: string[] = [];

    expect(layout).toMatch(/<SidebarInset[^>]*id="main-content"/);

    for await (const file of glob.scan({ cwd: root })) {
      // The auth layout has no SidebarInset, so its own <main> is the only one.
      if (file.startsWith("app/(auth)/layout")) continue;
      if ((await Bun.file(root + file).text()).includes("<main")) {
        nested.push(file);
      }
    }

    expect(nested).toEqual([]);
  });
});
