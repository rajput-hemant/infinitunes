import { afterEach, expect, it, mock } from "bun:test";

import type { Album, Song } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("../../components/play-button", () => ({
  PlayButton: () => null,
}));
// Names each row, so the test can see which list is on screen.
mock.module("../../components/song-list/song-list.client", () => ({
  SongListClient: ({ items }: { items: { title: string }[] }) => (
    <ul>
      {items.map((item) => (
        <li key={item.title}>song:{item.title}</li>
      ))}
    </ul>
  ),
}));

const { ArtistsTopItems } =
  await import("../../app/(root)/artist/[name]/[token]/_components/artists-top-items");

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

const songs = [{ id: "s1", title: "Tum Hi Ho" }] as unknown as Song[];
const albums = [
  {
    id: "a1",
    type: "album",
    title: "Aashiqui 2",
    subtitle: "2013",
    perma_url: "https://www.jiosaavn.com/album/aashiqui-2/tok_",
    image: "https://c.saavncdn.com/aashiqui-500x500.jpg",
    explicit_content: "0",
  },
] as unknown as Album[];

// One query client for the whole session, like the browser's, across both tabs.
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity } },
});

async function visit(type: "songs" | "albums") {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <ArtistsTopItems
          id="artist-1"
          type={type}
          initialSongs={type === "songs" ? songs : undefined}
          initialAlbums={type === "albums" ? albums : undefined}
        />
      </QueryClientProvider>,
    );
  });
  return container;
}

it("shows each tab's own list when the tabs are visited one after the other", async () => {
  const songsTab = await visit("songs");
  expect(songsTab.textContent).toContain("song:Tum Hi Ho");
  expect(songsTab.textContent).not.toContain("Aashiqui 2");

  // The Songs tab must not have left an empty Albums query behind.
  const albumsTab = await visit("albums");
  expect(albumsTab.textContent).toContain("Aashiqui 2");
  expect(albumsTab.textContent).not.toContain("song:Tum Hi Ho");
  expect(albumsTab.querySelector("a")?.getAttribute("href")).toContain(
    "aashiqui-2",
  );
});

it("shows the songs again on return, from the cache", async () => {
  const songsTab = await visit("songs");

  expect(songsTab.textContent).toContain("song:Tum Hi Ho");
});
