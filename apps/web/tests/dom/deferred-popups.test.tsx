import { afterEach, describe, expect, it } from "bun:test";

import type { MegaMenu } from "@infinitunes/types";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { NewPlaylistForm } from "../../components/playlist/new-playlist-form";
import { SearchMenu } from "../../components/search/search-menu";
import { MainNav } from "../../components/site-header/main-nav";
import { UserDropdown } from "../../components/user-dropdown";
import { DEFAULT_THEME_CONFIG } from "../../lib/theme-config";
import { ThemeConfigContext } from "../../lib/theme/provider";
import { waitFor } from "./wait-for";

const roots: Root[] = [];

const megaMenu: MegaMenu = {
  mega_menu: { top_artists: [], top_playlists: [], new_releases: [] },
};

async function mount(ui: React.ReactNode) {
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
          {ui}
        </ThemeConfigContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("toolbar popups load on intent", () => {
  it("renders the mega menu closed in the shell with the classes of the real one", async () => {
    const container = await mount(<MainNav megaMenu={megaMenu} />);
    const shellTrigger = container.querySelector("button") as HTMLElement;
    const shellLink = container.querySelector("a") as HTMLElement;
    expect(shellTrigger.getAttribute("aria-expanded")).toBe("false");
    const shellNav = container.querySelector("nav") as HTMLElement;
    const shellClasses = [shellNav, shellTrigger, shellLink].map(
      (el) => el.className,
    );

    await act(async () => {
      shellNav.dispatchEvent(new Event("pointerover", { bubbles: true }));
    });
    await waitFor(() => container.querySelector("button") !== shellTrigger);

    const realNav = container.querySelector("nav") as HTMLElement;
    const real = [
      realNav,
      container.querySelector("button") as HTMLElement,
      container.querySelector("a") as HTMLElement,
    ];
    expect(real.map((el) => el.className)).toEqual(shellClasses);
    expect(real[1]?.textContent).toBe(shellTrigger.textContent);
    // Nothing opened: the pointer was never on "Music".
    expect(real[1]?.getAttribute("aria-expanded")).toBe("false");
  });

  it("hands keyboard focus to the real trigger when the swap happens under it", async () => {
    const container = await mount(<UserDropdown />);
    const shell = container.querySelector("button") as HTMLButtonElement;
    expect(shell.getAttribute("aria-haspopup")).toBe("menu");
    await act(async () => shell.focus());
    expect(document.activeElement).toBe(shell);

    await waitFor(() => container.querySelector("button") !== shell);

    const real = container.querySelector("button") as HTMLButtonElement;
    expect(real.getAttribute("aria-label")).toBe("Open user menu");
    expect(document.activeElement).toBe(real);
  });

  it("opens search from Ctrl+K before the button was ever touched", async () => {
    await mount(<SearchMenu topSearch={null} />);
    expect(document.querySelector("[data-search-palette]")).toBeNull();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
      );
    });
    await waitFor(
      () => document.querySelector("[data-search-palette]") !== null,
    );
    expect(
      document
        .querySelector("button[aria-label='Search']")
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("keeps the wrapped trigger's own handler and marks it as a dialog trigger", async () => {
    let clicks = 0;
    const container = await mount(
      <NewPlaylistForm>
        <button type="button" onClick={() => void clicks++}>
          New
        </button>
      </NewPlaylistForm>,
    );
    const shell = container.querySelector("button") as HTMLButtonElement;
    expect(shell.getAttribute("aria-haspopup")).toBe("dialog");
    expect(shell.getAttribute("aria-expanded")).toBe("false");

    await act(async () => shell.click());
    expect(clicks).toBe(1);
    await waitFor(() => document.querySelector("[role=dialog]") !== null);
    expect(
      container.querySelector("button")?.getAttribute("aria-expanded"),
    ).toBe("true");
  });
});
