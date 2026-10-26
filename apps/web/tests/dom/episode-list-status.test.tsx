import { afterEach, beforeEach, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

type ObserverOptions = { onChange: (isIntersecting: boolean) => void };

let observerOptions: ObserverOptions | undefined;
let episodesQuery: () => Promise<unknown[]> = async () => [];

mock.module("~/hooks/use-intersection-observer", () => ({
  useIntersectionObserver: (options: ObserverOptions) => {
    observerOptions = options;
    return [() => {}] as const;
  },
}));
mock.module("~/components/song-list/song-list.client", () => ({
  SongListClient: () => null,
}));
mock.module("~/lib/trpc/vanilla", () => ({
  trpc: { show: { episodes: { query: () => episodesQuery() } } },
}));

const { EpisodeList } =
  await import("../../app/(root)/show/[name]/[season]/[token]/_components/episode-list");

const roots: Root[] = [];

async function render() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () =>
    root.render(
      <EpisodeList
        showId="show-1"
        season={1}
        sort="asc"
        totalEpisodes={10}
        initialEpisodes={[]}
      />,
    ),
  );
  return container;
}

beforeEach(() => {
  observerOptions = undefined;
  episodesQuery = async () => [];
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

it("keeps a persistent status region while more episodes can load", async () => {
  const container = await render();

  // Present while idle: a live region must exist before its content appears.
  const status = container.querySelector("output");
  expect(status).not.toBeNull();
  expect(status?.textContent).toBe("");
});

it("announces the loading text and hides the spinner from assistive tech", async () => {
  episodesQuery = () => new Promise(() => {});
  const container = await render();

  // TanStack Query notifies subscribers on a timer, so let that update land inside act.
  await act(async () => {
    observerOptions?.onChange(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const status = container.querySelector("output");
  expect(status?.textContent).toContain("Loading...");
  const spinner = status?.querySelector("svg");
  expect(spinner?.getAttribute("aria-hidden")).toBe("true");
});
