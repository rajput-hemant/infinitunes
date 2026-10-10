import { afterEach, expect, it, mock } from "bun:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const podcastShow = {
  id: "412160",
  type: "show",
  title: "cricket",
  subtitle: "Hubhopper",
  image_file_url: "https://c.sop.saavncdn.com/cricket-500x500.jpg",
  square_image_url: "https://c.sop.saavncdn.com/cricket-500x500.jpg",
  partner_name: "Hubhopper",
  label_name: "Parijat Innovators Pvt. Ltd",
  explicit_content: 0,
  song_info: "{}",
  latest_season_sequence: 1,
  artists: [],
  featured_artists: [],
  primary_artists: [],
  perma_url: "https://www.jiosaavn.com/shows/cricket/1/AgwxNRhhXMw_",
};

mock.module("../../lib/trpc/client", () => ({
  api: { useUtils: () => ({ search: { byType: { fetch: () => {} } } }) },
}));
mock.module("../../components/play-button", () => ({
  PlayButton: () => null,
}));
mock.module("../../components/song-list/song-list.client", () => ({
  SongListClient: () => null,
}));

const { SearchResults } =
  await import("../../app/(root)/search/[type]/[query]/_components/search-results");

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

it("renders podcast results with their artwork and show link", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);

  await act(async () => {
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <SearchResults
          query="cricket"
          type="show"
          initialSearchResults={{
            total: 1,
            start: 1,
            results: [podcastShow],
          }}
        />
      </QueryClientProvider>,
    );
  });

  const link = container.querySelector("a");
  expect(link?.getAttribute("href")).toContain("cricket");
  expect(container.textContent).toContain("cricket");
  expect(container.querySelector("img")?.getAttribute("src")).toContain(
    encodeURIComponent(podcastShow.image_file_url),
  );
});
