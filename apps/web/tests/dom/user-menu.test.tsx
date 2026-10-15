import { afterEach, describe, expect, it } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { UserDropdown } from "../../components/user-dropdown";
import { DEFAULT_THEME_CONFIG } from "../../lib/theme-config";
import { ThemeConfigContext } from "../../lib/theme/provider";
import { waitFor } from "./wait-for";

const roots: Root[] = [];
const realMatchMedia = window.matchMedia;

function setPhone(isPhone: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isPhone,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const user = { id: "u1", name: "Asha Rao", email: "asha@example.com" };

async function mount(props: { user?: typeof user }) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={{} as never}>
        <ThemeConfigContext.Provider
          value={{
            config: DEFAULT_THEME_CONFIG,
            update: () => {},
            reset: () => {},
            isDefault: true,
            isSaving: false,
          }}
        >
          <UserDropdown {...props} />
        </ThemeConfigContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return container;
}

async function openMenu(container: HTMLElement) {
  const trigger = container.querySelector(
    "button[aria-label='Open user menu']",
  ) as HTMLButtonElement;
  // The menu is its own chunk: the click starts the import and opens it on arrival.
  await act(async () => trigger.click());
  await waitFor(
    () =>
      document.querySelector("[role=menu], [data-slot=drawer-popup]") !== null,
  );
}

function labels() {
  return [
    ...document.querySelectorAll(
      "[role=menuitem], [role=dialog] a, [role=dialog] button:not([role=radio])",
    ),
  ].map((el) => el.textContent?.trim());
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  window.matchMedia = realMatchMedia;
});

describe("user menu on desktop", () => {
  it("lists the mockup items and a theme segment for a signed-in user", async () => {
    setPhone(false);
    await openMenu(await mount({ user }));

    const menu = document.querySelector("[role=menu]") as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.textContent).toContain("Asha Rao");
    expect(labels()).toEqual([
      "Library",
      "Liked Songs",
      "Settings",
      "Appearance",
      "Keyboard shortcuts",
      "Log out",
    ]);
    expect(
      menu.querySelectorAll("button[aria-label^='Toggle'][aria-pressed]"),
    ).toHaveLength(3);
    const hrefs = [...menu.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toEqual([
      "/me",
      "/me/liked-songs",
      "/settings",
      "/settings#appearance",
    ]);
  });

  it("hides library pages and offers sign in for a guest", async () => {
    setPhone(false);
    await openMenu(await mount({}));

    expect(labels()).toEqual([
      "Settings",
      "Appearance",
      "Keyboard shortcuts",
      "Log in",
    ]);
  });

  it("opens a shortcuts dialog listing the implemented shortcuts", async () => {
    setPhone(false);
    await openMenu(await mount({ user }));

    const item = [...document.querySelectorAll("[role=menuitem]")].find((el) =>
      el.textContent?.includes("Keyboard shortcuts"),
    ) as HTMLElement;
    await act(async () => item.click());

    const dialog = document.querySelector("[role=dialog]") as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain("Keyboard shortcuts");
    for (const action of ["Play or pause", "Toggle queue", "Search"]) {
      expect(dialog.textContent).toContain(action);
    }
    expect(dialog.querySelectorAll("kbd").length).toBeGreaterThan(8);
  });
});

describe("user menu below 768px", () => {
  it("opens a bottom sheet with the same items instead of a dropdown", async () => {
    setPhone(true);
    await openMenu(await mount({ user }));

    expect(document.querySelector("[role=menu]")).toBeNull();
    const sheet = document.querySelector(
      "[data-slot=drawer-popup]",
    ) as HTMLElement;
    expect(sheet).not.toBeNull();
    expect(labels()).toEqual([
      "Library",
      "Liked Songs",
      "Settings",
      "Appearance",
      "",
      "",
      "",
      "Keyboard shortcuts",
      "Log out",
    ]);
    expect(sheet.textContent).toContain("asha@example.com");
  });

  it("opens the shortcuts dialog from the sheet", async () => {
    setPhone(true);
    await openMenu(await mount({ user }));

    const item = [...document.querySelectorAll("[role=dialog] button")].find(
      (el) => el.textContent?.includes("Keyboard shortcuts"),
    ) as HTMLElement;
    await act(async () => item.click());

    const dialogs = [...document.querySelectorAll("[role=dialog]")];
    expect(dialogs.some((d) => d.textContent?.includes("Toggle queue"))).toBe(
      true,
    );
  });
});
