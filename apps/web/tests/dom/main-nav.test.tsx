import { afterEach, describe, expect, it } from "bun:test";

import type { MegaMenu } from "@infinitunes/types";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { MainNav } from "../../components/site-header/main-nav";

const roots: Root[] = [];

const megaMenu: MegaMenu = {
  mega_menu: { top_artists: [], top_playlists: [], new_releases: [] },
};

function findTrigger(container: HTMLElement) {
  return [...container.querySelectorAll("button")].find((button) =>
    button.textContent?.includes("Music"),
  );
}

async function mount(menu: MegaMenu = megaMenu) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<MainNav megaMenu={menu} />);
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("MainNav", () => {
  it("renders the mega menu trigger as a button, not inside a link", async () => {
    const container = await mount();
    const trigger = findTrigger(container);

    expect(trigger).toBeDefined();
    expect(trigger?.closest("a")).toBeNull();
  });

  it("opens to a View all Music link", async () => {
    const container = await mount();
    const trigger = findTrigger(container);
    expect(trigger).toBeDefined();

    await act(async () => trigger?.click());

    const link = [...document.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("View all Music"),
    );
    expect(link?.getAttribute("href")).toBe("/");
  });

  it("decodes HTML entities in item titles", async () => {
    const container = await mount({
      mega_menu: {
        ...megaMenu.mega_menu,
        new_releases: [
          {
            title: "Bhootni Ka (From &quot;Udta Teer&quot;)",
            perma_url: "https://www.jiosaavn.com/song/bhootni-ka/Qy1TVzp4XmQ",
          },
        ],
      },
    } as MegaMenu);

    await act(async () => findTrigger(container)?.click());

    const link = [...document.querySelectorAll("a")].find((a) =>
      a.getAttribute("href")?.includes("Qy1TVzp4XmQ"),
    );
    expect(link?.textContent).toBe('Bhootni Ka (From "Udta Teer")');
    expect(link?.getAttribute("title")).toBe('Bhootni Ka (From "Udta Teer")');
  });
});
