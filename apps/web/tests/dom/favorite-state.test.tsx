import { describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
import type { Queue as QueueItem, Song } from "@infinitunes/types";
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

async function withMenu(
  favorites: Favorite | null | undefined,
  inspect: () => void,
  mobile = false,
  props: Partial<React.ComponentProps<typeof TileMoreButton>> = {},
) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <api.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TileMoreButton
              item={item}
              favorites={favorites}
              showAlbum
              {...props}
            />
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
    triggers[mobile ? 0 : triggers.length - 1]?.click();
  });

  try {
    inspect();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
}

async function menuLabelsFor(favorites: Favorite | null | undefined) {
  const labels: (string | null)[] = [];
  await withMenu(favorites, () => {
    labels.push(
      ...[...document.querySelectorAll('[role="menuitem"]')].map(
        (el) => el.textContent,
      ),
    );
  });
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

describe("tile more-button mobile menu", () => {
  it("scrolls playlist actions and detail links without shrinking their touch targets", async () => {
    const song = {
      id: item.id,
      title: item.name,
      subtitle: item.subtitle,
      type: "song",
      perma_url: item.url,
      image: item.image,
      more_info: {
        album_url: "https://www.jiosaavn.com/album/album-1/abc",
        artistMap: {
          primary_artists: Array.from({ length: 4 }, (_, i) => ({
            id: `artist-${i}`,
            name: `Artist ${i}`,
            type: "artist",
            role: "singer",
            image: "",
            perma_url: `https://www.jiosaavn.com/artist/artist-${i}/abc`,
          })),
        },
      },
    } as Song;

    await withMenu(
      undefined,
      () => {
        const content = document.querySelector('[data-slot="drawer-content"]');
        const scroll = content?.querySelector(".overflow-y-auto");
        expect(scroll).not.toBeNull();
        expect(scroll?.classList.contains("min-h-0")).toBe(true);
        expect(scroll?.classList.contains("overflow-x-hidden")).toBe(true);

        const actions = [
          ...(scroll?.querySelectorAll("button.shrink-0") ?? []),
        ];
        expect(actions).toHaveLength(8);
        expect(
          actions.some(
            (action) => action.textContent === "Remove from Playlist",
          ),
        ).toBe(true);
        for (const action of actions) {
          expect(action.classList.contains("shrink-0")).toBe(true);
        }

        const links = [...(scroll?.querySelectorAll("a") ?? [])].filter(
          (link) =>
            link.textContent?.startsWith("More ") ||
            link.textContent === "Song Details & Lyrics",
        );
        expect(links).toHaveLength(6);
        for (const link of links) {
          expect(link.classList.contains("shrink-0")).toBe(true);
          expect(link.classList.contains("min-h-(--ctl-lg)")).toBe(true);
        }
      },
      true,
      { item: song, playlistId: "playlist-1", playlistSongIndex: 0 },
    );
  });
});
