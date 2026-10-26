import { afterEach, expect, it, mock } from "bun:test";

import { Suspense, act } from "react";
import { createRoot, type Root } from "react-dom/client";

const viewer = {
  user: { id: "signed-in-user" },
  favorites: { songs: ["song-1"] },
  playlists: [{ id: "playlist-1" }],
};
const getViewer = mock(async () => viewer);
let rowProps: unknown;
mock.module("~/lib/viewer", () => ({ getViewer }));
mock.module("~/lib/metadata", () => ({ pageMetadata: () => ({}) }));
mock.module("~/lib/trpc/server", () => ({
  api: { search: { byType: async () => ({ total: 1, results: [] }) } },
}));
mock.module(
  "../../app/(root)/search/(results)/[type]/[query]/_components/all-results",
  () => ({ AllResults: () => null }),
);
mock.module(
  "../../app/(root)/search/(results)/[type]/[query]/_components/search-page",
  () => ({
    toSearchPage: () => ({ total: 1, rows: [{ id: "song-1" }], cards: [] }),
  }),
);
mock.module("../../components/song-list/song-list.client", () => ({
  SongListClient: (props: unknown) => {
    rowProps = props;
    return <output>Song rows</output>;
  },
}));
const { default: SearchPage } =
  await import("../../app/(root)/search/(results)/[type]/[query]/page");
let root: Root;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

it("resolves the song viewer behind Suspense and forwards the library to song rows", async () => {
  const page = SearchPage({
    params: Promise.resolve({ type: "song", query: "song" }),
    searchParams: Promise.resolve({}),
  });
  expect(page.type).toBe(Suspense);
  const results = await page.props.children.type(page.props.children.props);
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(results));
  expect(getViewer).toHaveBeenCalledTimes(1);
  expect(rowProps).toMatchObject({
    user: viewer.user,
    userFavorites: viewer.favorites,
    userPlaylists: viewer.playlists,
  });
});
