import { afterEach, describe, expect, it } from "bun:test";

import type { MegaMenu } from "@infinitunes/types";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { MainNavPopup } from "../../components/site-header/main-nav-popup";
import { waitFor } from "./wait-for";

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

// The mega menu is upstream editorial data: the same title can be listed twice
// (a single and its album, a playlist featured in two slots).
const megaMenu: MegaMenu = {
  mega_menu: {
    new_releases: [
      { title: "Twin", perma_url: "https://www.jiosaavn.com/album/twin/aaa" },
      { title: "Twin", perma_url: "https://www.jiosaavn.com/song/twin/bbb" },
    ],
    top_playlists: [],
    top_artists: [],
  },
} as unknown as MegaMenu;

describe("MainNavPopup", () => {
  it("lists every entry when two share a title, each with its own link", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => {
      root.render(
        <AppRouterContext.Provider value={{} as never}>
          <MainNavPopup megaMenu={megaMenu} defaultOpen />
        </AppRouterContext.Provider>,
      );
    });

    await waitFor(() => document.querySelector('a[title="Twin"]') !== null);

    const hrefs = [...document.querySelectorAll('a[title="Twin"]')].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toHaveLength(2);
    expect(new Set(hrefs).size).toBe(2);
  });
});
