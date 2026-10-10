import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { Sidebar, SidebarContent } from "@infinitunes/ui/components/sidebar";
import { useIsMobile } from "@infinitunes/ui/hooks/use-mobile";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  AppSidebarProvider,
  AppSidebarTrigger,
  Sidebar as AppSidebar,
} from "../../components/sidebar";
import { MobileNav } from "../../components/site-header/mobile-nav";
import { Toolbar } from "../../components/site-header/toolbar";
import type { User } from "../../lib/auth";

const router = {} as never;
const roots: Root[] = [];

const setWidth = (width: number) =>
  (
    window as unknown as {
      happyDOM: { setViewport: (v: { width: number }) => void };
    }
  ).happyDOM.setViewport({ width });

async function mount(ui: React.ReactNode, pathname: string | null = null) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value={pathname}>
          {ui}
        </PathnameContext.Provider>
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

  // happy-dom does not turn Enter/Space on a button into a click, so this
  // checks what the app controls: the trigger stays natively activatable and
  // nothing cancels or hijacks those keys.
  it("keeps Enter and Space native: focusable, type=button, not cancelled", async () => {
    const container = await mount(<DesktopShell />);
    const button = trigger(container);
    const state = () =>
      document.querySelector("[data-slot=sidebar]")?.getAttribute("data-state");

    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute("type")).toBe("button");
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.tabIndex).toBeGreaterThanOrEqual(0);

    for (const [type, key] of [
      ["keydown", "Enter"],
      ["keydown", " "],
      ["keyup", " "],
    ] as const) {
      const event = new KeyboardEvent(type, {
        key,
        bubbles: true,
        cancelable: true,
      });
      await act(async () => {
        button.dispatchEvent(event);
      });
      expect(event.defaultPrevented).toBe(false);
    }
    expect(state()).toBe("expanded");
  });
});

const user = {
  id: "u1",
  name: "U",
  email: "u@x.dev",
  emailVerified: true,
  image: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
} satisfies User;

const link = (name: string) =>
  [...document.querySelectorAll("a")].find(
    (a) => a.textContent?.trim() === name && a.closest("[data-slot=sidebar]"),
  );

describe("sidebar active route", () => {
  beforeEach(() => setWidth(1280));

  it("marks the library item for its own route, not just a top-level segment", async () => {
    await mount(
      <AppSidebarProvider>
        <AppSidebar user={user} userPlaylists={[]} />
      </AppSidebarProvider>,
      "/me/recently-played",
    );

    expect(link("Recently Played")?.getAttribute("aria-current")).toBe("page");
    expect(link("Your Favorite")?.hasAttribute("aria-current")).toBe(false);
    expect(link("Top Albums")?.hasAttribute("aria-current")).toBe(false);
  });

  it("keeps a browse item active on its detail pages", async () => {
    await mount(
      <AppSidebarProvider>
        <AppSidebar />
      </AppSidebarProvider>,
      "/album/some-album",
    );

    expect(link("Top Albums")?.getAttribute("aria-current")).toBe("page");
    expect(link("Top Charts")?.hasAttribute("aria-current")).toBe(false);
  });

  it("marks the matching playlist", async () => {
    await mount(
      <AppSidebarProvider>
        <AppSidebar
          user={user}
          userPlaylists={[
            { id: "p1", name: "Road trip" },
            { id: "p2", name: "Focus" },
          ]}
        />
      </AppSidebarProvider>,
      "/me/playlist/p2",
    );

    expect(link("Focus")?.getAttribute("aria-current")).toBe("page");
    expect(link("Road trip")?.hasAttribute("aria-current")).toBe(false);
  });
});

describe("sidebar collapse", () => {
  beforeEach(() => setWidth(1280));

  const collapsible = () =>
    document
      .querySelector("[data-slot=sidebar]")
      ?.getAttribute("data-collapsible");

  function Shell({ defaultOpen }: { defaultOpen?: boolean }) {
    return (
      <AppSidebarProvider defaultOpen={defaultOpen}>
        <AppSidebarTrigger />
        <AppSidebar user={user} userPlaylists={[]} />
      </AppSidebarProvider>
    );
  }

  it("collapses to the icon rail from the toolbar trigger and the keyboard", async () => {
    const container = await mount(<Shell />);
    const trigger = container.querySelector(
      "[data-slot=sidebar-trigger]",
    ) as HTMLButtonElement;

    expect(collapsible()).toBe("");

    await act(async () => trigger.click());
    expect(collapsible()).toBe("icon");

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "b", ctrlKey: true }),
      );
    });
    expect(collapsible()).toBe("");
  });

  it("starts collapsed when the persisted state says so", async () => {
    await mount(<Shell defaultOpen={false} />);

    expect(collapsible()).toBe("icon");
  });

  it("keeps every nav link named while collapsed", async () => {
    await mount(<Shell defaultOpen={false} />);

    expect(link("Top Albums")).toBeDefined();
    expect(link("Recently Played")).toBeDefined();
  });
});

// happy-dom keeps scrollY as a plain property, so tests set it and fire the
// scroll event the hooks listen for.
const originalScrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  window.dispatchEvent(new Event("scroll"));
}
const restoreScrollY = () => {
  if (originalScrollY)
    Object.defineProperty(window, "scrollY", originalScrollY);
  else Reflect.deleteProperty(window, "scrollY");
};

describe("tab bar", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-tab-min");
    restoreScrollY();
  });

  it("is one glass item per tab, and only the current one is marked", async () => {
    const container = await mount(<MobileShell />, "/browse/x");
    const items = container.querySelectorAll(
      "nav[aria-label=Primary] > [data-glass-item]",
    );
    const current = [...items].filter((item) =>
      item.hasAttribute("aria-current"),
    );

    expect(items).toHaveLength(5);
    expect(current.map((item) => item.textContent)).toEqual(["Browse"]);
  });

  it("minimizes after scrolling down and expands on scrolling back to the top", async () => {
    await mount(<MobileShell />, "/search");
    setScrollY(0);

    setScrollY(60);
    expect(document.documentElement.dataset.tabMin).toBe("true");

    setScrollY(20);
    expect(document.documentElement.dataset.tabMin).toBeUndefined();
  });

  it("expands on a tap instead of navigating away from the current tab", async () => {
    const container = await mount(<MobileShell />, "/search");
    setScrollY(0);
    setScrollY(60);
    const current = container.querySelector(
      "a[aria-current=page]",
    ) as HTMLElement;

    expect(document.documentElement.dataset.tabMin).toBe("true");

    await act(async () => current.click());

    expect(document.documentElement.dataset.tabMin).toBeUndefined();
  });

  it("marks the current tab", async () => {
    const container = await mount(<MobileShell />, "/search");
    const current = container.querySelectorAll("a[aria-current=page]");

    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toBe("Search");
  });

  it("does not mark Home on other routes", async () => {
    const container = await mount(<MobileShell />, "/search/foo");

    expect(
      [...container.querySelectorAll("a")]
        .find((a) => a.textContent === "Home")
        ?.hasAttribute("aria-current"),
    ).toBe(false);
  });
});

describe("toolbar scroll edge", () => {
  afterEach(restoreScrollY);

  it("sets data-scrolled on the toolbar once the page scrolls past the threshold", async () => {
    const container = await mount(<Toolbar>Title</Toolbar>);
    const edge = container.querySelector<HTMLElement>(
      '[data-glass-edge="top"]',
    );

    expect(edge?.dataset.scrolled).toBe("false");

    setScrollY(120);
    expect(edge?.dataset.scrolled).toBe("true");

    setScrollY(0);
    expect(edge?.dataset.scrolled).toBe("false");
  });
});

describe("glass sidebar", () => {
  beforeEach(() => setWidth(1280));

  it("is one glass surface with no glass nested inside it", async () => {
    await mount(
      <AppSidebarProvider>
        <AppSidebar user={user} userPlaylists={[{ id: "p1", name: "Focus" }]} />
      </AppSidebarProvider>,
    );
    const panel = document.querySelector("[data-glass-role=sidebar]");

    expect(panel).not.toBeNull();
    expect(panel?.querySelector("[data-glass]")).toBeNull();
  });
});
