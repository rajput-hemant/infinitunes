import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { Sidebar, SidebarContent } from "@infinitunes/ui/components/sidebar";
import { useIsMobile } from "@infinitunes/ui/hooks/use-mobile";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  AppSidebarProvider,
  AppSidebarTrigger,
} from "../../components/sidebar";
import { MobileNav } from "../../components/site-header/mobile-nav";

const router = {} as never;
const roots: Root[] = [];

const setWidth = (width: number) =>
  (
    window as unknown as {
      happyDOM: { setViewport: (v: { width: number }) => void };
    }
  ).happyDOM.setViewport({ width });

async function mount(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        {ui}
      </AppRouterContext.Provider>,
    );
  });
  return container;
}

const sheet = () => document.querySelector("[data-mobile=true]");
const libraryButton = (c: Element) =>
  [...c.querySelectorAll("button")].find((b) =>
    b.textContent?.includes("Library"),
  ) as HTMLButtonElement;

beforeEach(() => setWidth(500));

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  document.cookie = "sidebar_state=; path=/; max-age=0";
  setWidth(1024);
});

function MobileShell() {
  return (
    <AppSidebarProvider>
      <MobileNav />
      <Sidebar>
        <SidebarContent>Library contents</SidebarContent>
      </Sidebar>
    </AppSidebarProvider>
  );
}

describe("mobile shell", () => {
  it("opens the sidebar sheet from the MobileNav Library item", async () => {
    const container = await mount(<MobileShell />);
    const library = libraryButton(container);

    expect(sheet()).toBeNull();
    expect(library.getAttribute("aria-expanded")).toBe("false");

    await act(async () => library.click());

    expect(sheet()?.textContent).toContain("Library contents");
    expect(library.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the sheet with Escape", async () => {
    const container = await mount(<MobileShell />);
    await act(async () => libraryButton(container).click());
    expect(sheet()).not.toBeNull();

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(sheet()).toBeNull();
    expect(libraryButton(container).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("toggles the sheet with Ctrl+B", async () => {
    await mount(<MobileShell />);

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
      );
    });

    expect(sheet()).not.toBeNull();
  });
});

describe("mobile breakpoint", () => {
  function Probe() {
    return <span data-mobile={String(useIsMobile())} />;
  }
  const read = (c: Element) => c.querySelector("span")?.dataset.mobile;

  it("is mobile below 1024px and desktop from 1024px", async () => {
    setWidth(1023);
    expect(read(await mount(<Probe />))).toBe("true");
    setWidth(1024);
    expect(read(await mount(<Probe />))).toBe("false");
  });
});

describe("collapsible sidebar trigger", () => {
  const trigger = (c: Element) =>
    c.querySelector("[data-slot=sidebar-trigger]") as HTMLButtonElement;

  function DesktopShell() {
    return (
      <AppSidebarProvider>
        <AppSidebarTrigger />
        <Sidebar collapsible="icon">
          <SidebarContent>Library contents</SidebarContent>
        </Sidebar>
      </AppSidebarProvider>
    );
  }

  beforeEach(() => setWidth(1280));

  it("is a native button, so Enter and Space activate it", async () => {
    const container = await mount(<DesktopShell />);

    expect(trigger(container).tagName).toBe("BUTTON");
    expect(trigger(container).getAttribute("aria-controls")).toBe(
      "app-sidebar",
    );
  });

  it("flips aria-expanded, the label and the data-state on click", async () => {
    const container = await mount(<DesktopShell />);
    const state = () =>
      document.querySelector("[data-slot=sidebar]")?.getAttribute("data-state");

    expect(trigger(container).getAttribute("aria-expanded")).toBe("true");
    expect(trigger(container).getAttribute("aria-label")).toBe(
      "Collapse sidebar",
    );
    expect(state()).toBe("expanded");

    await act(async () => trigger(container).click());

    expect(trigger(container).getAttribute("aria-expanded")).toBe("false");
    expect(trigger(container).getAttribute("aria-label")).toBe(
      "Expand sidebar",
    );
    expect(state()).toBe("collapsed");
    expect(document.cookie).toContain("sidebar_state=false");

    await act(async () => trigger(container).click());

    expect(trigger(container).getAttribute("aria-expanded")).toBe("true");
    expect(state()).toBe("expanded");
  });
});
