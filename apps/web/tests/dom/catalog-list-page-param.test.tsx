import { afterEach, beforeEach, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const calls: Record<string, unknown[]> = {};

function procedure(name: string, result: () => unknown) {
  return {
    query: async (input: unknown) => {
      (calls[name] ??= []).push(input);
      return result();
    },
  };
}

const album = (id: string) => ({
  id,
  title: id,
  type: "album",
  image: "",
  perma_url: `https://www.jiosaavn.com/album/${id}/${id}`,
});

const pageOf = (id: string) => ({ data: [album(id)], last_page: false });
const stations = (prefix: string) =>
  Array.from({ length: 50 }, (_, i) => album(`${prefix}${i}`));

mock.module("~/lib/trpc/vanilla", () => ({
  trpc: {
    get: {
      topAlbums: procedure("topAlbums", () => pageOf("next")),
      featuredPlaylists: procedure("featuredPlaylists", () => pageOf("next")),
      featuredStations: procedure("featuredStations", () => stations("n")),
      topShows: procedure("topShows", () => pageOf("next")),
    },
  },
}));

mock.module("~/components/catalog-load-more", () => ({
  CatalogLoadMore: ({ onLoadMore }: { onLoadMore: () => void }) => (
    <button type="button" data-testid="more" onClick={onLoadMore}>
      more
    </button>
  ),
}));

mock.module("~/components/slider/slider-card", () => ({
  FIRST_ROW_CARDS: 0,
  SliderCard: ({ name }: { name: string }) => <div>{name}</div>,
}));

const { TopAlbums } =
  await import("../../app/(root)/album/_components/top-albums");
const { FeaturedPlaylists } =
  await import("../../app/(root)/playlist/_components/featured-playlists");
const { FeaturedStations } =
  await import("../../app/(root)/radio/_components/featured-stations");
const { TopPodcasts } =
  await import("../../app/(root)/show/_components/top-podcasts");

const roots: Root[] = [];

async function loadMore(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(ui));
  await act(async () =>
    container.querySelector<HTMLButtonElement>("[data-testid=more]")?.click(),
  );
}

beforeEach(() => {
  for (const key of Object.keys(calls)) delete calls[key];
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

it("top albums seeded at page 3 asks for page 4 next", async () => {
  await loadMore(<TopAlbums initialAlbums={pageOf("a") as never} page={3} />);
  expect(calls.topAlbums?.[0]).toMatchObject({ page: 4 });
});

it("featured playlists seeded at page 3 asks for page 4 next", async () => {
  await loadMore(
    <FeaturedPlaylists initialPlaylists={pageOf("a") as never} page={3} />,
  );
  expect(calls.featuredPlaylists?.[0]).toMatchObject({ page: 4 });
});

it("featured stations seeded at page 3 asks for page 4 next", async () => {
  await loadMore(
    <FeaturedStations initialStations={stations("i") as never} page={3} />,
  );
  expect(calls.featuredStations?.[0]).toMatchObject({ page: 4 });
});

it("top podcasts seeded at page 3 asks for page 4 next", async () => {
  await loadMore(
    <TopPodcasts initialTopShows={pageOf("a") as never} page={3} />,
  );
  expect(calls.topShows?.[0]).toMatchObject({ page: 4 });
});

it("defaults to page 1, so the next request is page 2", async () => {
  await loadMore(<TopAlbums initialAlbums={pageOf("a") as never} />);
  expect(calls.topAlbums?.[0]).toMatchObject({ page: 2 });
});
