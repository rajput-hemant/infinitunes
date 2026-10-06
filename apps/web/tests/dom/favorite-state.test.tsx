import { describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
import type { Queue as QueueItem } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";

import { api } from "../../lib/trpc/client";

// `server-only` throws outside the react-server condition; the action module
// behind the button only needs it to import, nothing here calls an action.
mock.module("server-only", () => ({}));
const { TileMoreButton } =
  await import("../../components/song-list/more-button");

const item: QueueItem = {
  id: "song-1",
  name: "Song 1",
  subtitle: "",
  url: "https://www.jiosaavn.com/song/song-1/abc",
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  artists: [],
  download_url: "",
  duration: 100,
};

const queryClient = new QueryClient();
const trpcClient = api.createClient({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});

const router = {
  push() {},
  replace() {},
  refresh() {},
  back() {},
  forward() {},
  prefetch() {},
} as unknown as NonNullable<React.ContextType<typeof AppRouterContext>>;

async function menuLabelsFor(favorites: Favorite | null | undefined) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <api.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TileMoreButton item={item} favorites={favorites} showAlbum />
          </QueryClientProvider>
        </api.Provider>
      </AppRouterContext.Provider>,
    );
  });

  // The dropdown trigger is the second "More Options" button (the first opens
  // the mobile drawer).
  const triggers = document.querySelectorAll<HTMLButtonElement>(
    '[aria-label="More Options"]',
  );
  await act(async () => {
    triggers[triggers.length - 1]?.click();
  });

  const labels = [...document.querySelectorAll('[role="menuitem"]')].map(
    (el) => el.textContent,
  );
  await act(async () => root.unmount());
  container.remove();
  return labels;
}

describe("tile more-button favorite state", () => {
  it("offers 'Add To Favourite' when the song is not a favorite", async () => {
    const labels = await menuLabelsFor({ songs: [] } as unknown as Favorite);

    expect(labels).toContain("Add To Favourite");
    expect(labels).not.toContain("Remove From Favourite");
  });

  it("offers 'Remove From Favourite' when favorites include the song", async () => {
    const labels = await menuLabelsFor({
      songs: ["song-1"],
    } as unknown as Favorite);

    expect(labels).toContain("Remove From Favourite");
    expect(labels).not.toContain("Add To Favourite");
  });

  it("hides the favourite action when favorites could not be loaded", async () => {
    const labels = await menuLabelsFor(null);

    expect(labels).toContain("Play Song Now");
    expect(labels).not.toContain("Add To Favourite");
    expect(labels).not.toContain("Remove From Favourite");
  });
});
