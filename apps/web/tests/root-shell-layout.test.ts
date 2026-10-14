import { describe, expect, it } from "bun:test";

const ROOT_LAYOUT = new URL("../app/(root)/layout.tsx", import.meta.url);
const SIDEBAR = new URL("../components/sidebar.tsx", import.meta.url);
const NAVBAR = new URL("../components/site-header/navbar.tsx", import.meta.url);

describe("root shell layout", () => {
  it("puts the toolbar in the main column, above the single main landmark", async () => {
    const layout = await Bun.file(ROOT_LAYOUT).text();
    const order = [
      "<AppSidebarProvider",
      "<ViewerSidebar",
      "<Navbar />",
      "<SidebarInset",
    ].map((marker) => layout.indexOf(marker));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(layout).not.toMatch(/<SidebarInset[^>]*>\s*<Navbar/);
  });

  it("renders the phone tab bar inside the sidebar provider", async () => {
    const layout = await Bun.file(ROOT_LAYOUT).text();

    expect(layout.indexOf("<AppSidebarProvider")).toBeLessThan(
      layout.indexOf("<ViewerMobileNav"),
    );
    expect(layout.indexOf("<ViewerMobileNav")).toBeLessThan(
      layout.indexOf("</AppSidebarProvider>"),
    );
  });

  it("reads no request data in its body, so the chrome prerenders", async () => {
    const layout = await Bun.file(ROOT_LAYOUT).text();

    expect(layout).not.toContain("cookies(");
    expect(layout).not.toContain("headers(");
    expect(layout).not.toMatch(/\bawait\b/);
    expect(layout).not.toContain("instant");
    // The visitor is a promise handed to islands, never awaited here.
    expect(layout).toContain("<ViewerProvider viewer={getViewer()}>");
  });

  it("sizes the sidebar from the token and the collapsed rail from one value", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).toContain('"--sidebar-width": "var(--side-w)"');
    expect(sidebar).toContain('"--sidebar-width-icon": "4.5rem"');
    expect(sidebar).toContain('collapsible="icon"');
  });

  it("swaps the desktop sidebar for the tablet rail below lg", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).toContain("max-lg:hidden");
    expect(sidebar).toContain("md:max-lg:flex");
  });

  it("has no toolbar offset left over from the full-width navbar", async () => {
    const sidebar = await Bun.file(SIDEBAR).text();

    expect(sidebar).not.toContain("top-14");
  });

  it("exposes the sidebar toggle in the toolbar from tablet up", async () => {
    const navbar = await Bun.file(NAVBAR).text();

    expect(navbar).toMatch(/<AppSidebarTrigger[^>]*md:inline-flex/);
    expect(navbar).not.toContain("<MobileNav");
  });
});
