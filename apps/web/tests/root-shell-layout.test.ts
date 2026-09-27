import { describe, expect, it } from "bun:test";

const ROOT_LAYOUT = new URL("../app/(root)/layout.tsx", import.meta.url);
const SIDEBAR = new URL("../components/sidebar.tsx", import.meta.url);

describe("root shell layout", () => {
  it("keeps the navbar inside the sidebar provider and above the inset row", async () => {
    const layout = await Bun.file(ROOT_LAYOUT).text();

    expect(layout.indexOf("<AppSidebarProvider>")).toBeLessThan(
      layout.indexOf("<Navbar />"),
    );
    expect(layout.indexOf("<Navbar />")).toBeLessThan(
      layout.indexOf("<Sidebar user="),
    );
    expect(layout).not.toMatch(/<SidebarInset>\s*\n\s*<Navbar/);
  });

  it("routes master-parity sidebar width through the provider style merge", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).toContain("masterSidebarWidthClassName");
    expect(sidebar).toContain("lg:[--app-sidebar-width:20%]");
    expect(sidebar).toContain('"--sidebar-width": "var(--app-sidebar-width');
    expect(sidebar).toContain("flex-col");
  });

  it("offsets the desktop sidebar below the sticky navbar like master top-14", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).toContain("masterSidebarDesktopOffsetClassName");
    expect(sidebar).toContain("top-14 h-[calc(100svh-3.5rem)]");
    expect(sidebar).toContain(
      "<SidebarPrimitive className={masterSidebarDesktopOffsetClassName}",
    );
  });

  it("reserves main-column space when the desktop sidebar is expanded", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).toContain("masterSidebarGapShellClassName");
    expect(sidebar).toContain("w-0 shrink-0");
    expect(sidebar).toContain(
      "has-[[data-slot=sidebar][data-state=expanded]]:lg:w-[20%]",
    );
    expect(sidebar).toContain(
      "has-[[data-slot=sidebar][data-state=expanded]]:xl:w-[15%]",
    );
    expect(sidebar).toContain(
      "has-[[data-slot=sidebar][data-state=expanded]]:2xl:w-[12.5%]",
    );
  });

  it("releases main-column space when the desktop sidebar is collapsed", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).toContain("w-0 shrink-0");
    expect(sidebar).not.toMatch(/sidebar-gap\]\]:!w-/);
    expect(sidebar).not.toMatch(
      /\[&_\[data-slot=sidebar\]\[data-state=collapsed\].*sidebar-gap/,
    );
  });
});
