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
});
