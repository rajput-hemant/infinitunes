import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const image = "https://c.saavncdn.com/cover-500x500.jpg";

const fakeApi = {
  home: {
    home: async () => ({
      new_albums: [
        {
          id: "n1",
          title: "New One",
          type: "album",
          image,
          perma_url: "https://www.jiosaavn.com/album/new-one/n1",
        },
      ],
      tag_mixes: [
        {
          id: "m1",
          title: "Daily",
          type: "playlist",
          image,
          perma_url: "https://www.jiosaavn.com/mix/daily/m1",
        },
      ],
    }),
  },
  get: {
    topAlbums: async () => ({
      data: [{ id: "a1", title: "A", type: "album", image, perma_url: "" }],
    }),
    charts: async () => [
      { id: "c1", title: "C", type: "playlist", image, perma_url: "" },
    ],
    featuredPlaylists: async () => ({
      data: [{ id: "p1", title: "P", type: "playlist", image, perma_url: "" }],
    }),
    topShows: async () => ({
      data: [{ id: "s1", title: "S", type: "show", image, perma_url: "" }],
    }),
    topArtists: async () => ({
      top_artists: [{ artistid: "r1", name: "R", image, perma_url: "" }],
    }),
    featuredStations: async () => [
      { id: "st1", title: "St", type: "radio_station", image, perma_url: "" },
    ],
  },
};

mock.module("~/lib/trpc/server", () => ({ api: fakeApi }));

const { default: BrowsePage } = await import("../../app/(root)/browse/page");

const roots: Root[] = [];

async function render() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(await BrowsePage());
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
});

function linkFor(container: HTMLElement, label: string) {
  const link = [...container.querySelectorAll("a")].find(
    (a) => a.textContent === label,
  );
  return link?.getAttribute("href");
}

describe("Browse page", () => {
  it("links each category tile to the closest existing route", async () => {
    const container = await render();

    expect(linkFor(container, "Top Albums")).toBe("/album");
    expect(linkFor(container, "Top Charts")).toBe("/chart");
    expect(linkFor(container, "Top Playlists")).toBe("/playlist");
    expect(linkFor(container, "Podcasts")).toBe("/show");
    expect(linkFor(container, "Top Artists")).toBe("/artist");
    expect(linkFor(container, "Radio")).toBe("/radio");
    expect(linkFor(container, "New Releases")).toBe("/album");
    expect(linkFor(container, "Made for you")).toBe("/mix/daily/m1");
  });

  it("links each language to its album list filtered by language", async () => {
    const container = await render();

    expect(linkFor(container, "Hindi")).toBe("/album?lang=hindi");
    expect(linkFor(container, "English")).toBe("/album?lang=english");
  });

  it("drops the Made for you tile when upstream has no mix", async () => {
    const original = fakeApi.home.home;
    fakeApi.home.home = async () => ({ new_albums: [], tag_mixes: [] });
    try {
      const container = await render();

      expect(linkFor(container, "Made for you")).toBeUndefined();
      expect(linkFor(container, "Top Charts")).toBe("/chart");
    } finally {
      fakeApi.home.home = original;
    }
  });
});
