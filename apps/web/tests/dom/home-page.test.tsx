import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const image = "https://c.saavncdn.com/cover-500x500.jpg";

const album = (id: string) => ({
  id,
  title: `Album ${id}`,
  type: "album",
  image,
  perma_url: `https://www.jiosaavn.com/album/album-${id}/${id}`,
  subtitle: "",
});

const playlist = (id: string) => ({
  id,
  title: `Playlist ${id}`,
  type: "playlist",
  image,
  perma_url: `https://www.jiosaavn.com/featured/playlist-${id}/${id}`,
  subtitle: "Fresh songs",
});

const modules = {
  new_albums: [album("1"), album("2"), album("3"), album("4"), album("5")],
  top_playlists: [
    playlist("a"),
    playlist("b"),
    playlist("c"),
    playlist("d"),
    playlist("e"),
    playlist("f"),
  ],
  modules: { top_playlists: { title: "Top playlists" } },
};

mock.module("~/lib/trpc/server", () => ({
  api: { home: { home: async () => modules } },
}));
mock.module("~/lib/trpc/client", () => ({
  api: { useUtils: () => ({}) },
}));
mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const { default: HomePage } = await import("../../app/(root)/page");

const roots: Root[] = [];

async function render() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(await HomePage());
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
});

describe("Home page", () => {
  it("features the first top playlist with a play control", async () => {
    const container = await render();

    expect(container.textContent).toContain("Featured playlist");
    const play = container.querySelector(
      'button[aria-label="Play Playlist a"]',
    );
    expect(play).not.toBeNull();
    expect(container.querySelector("h2 a")?.getAttribute("href")).toBe(
      "/playlist/playlist-a/a",
    );
  });

  it("lists quick picks: four albums then the next playlists", async () => {
    const container = await render();

    const heading = [...container.querySelectorAll("h2")].find(
      (h) => h.textContent === "Quick picks",
    );
    const quick = heading?.parentElement?.querySelectorAll("li a") ?? [];
    expect([...quick].map((a) => a.getAttribute("href"))).toEqual([
      "/album/album-1/1",
      "/album/album-2/2",
      "/album/album-3/3",
      "/album/album-4/4",
      "/playlist/playlist-b/b",
      "/playlist/playlist-c/c",
      "/playlist/playlist-d/d",
      "/playlist/playlist-e/e",
    ]);
  });

  it("keeps the existing shelves", async () => {
    const container = await render();

    expect(container.textContent).toContain("Top playlists");
  });
});
