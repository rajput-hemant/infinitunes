import { beforeEach, describe, expect, it, mock } from "bun:test";

import type { Episode, Queue, Song } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";

import { api } from "../../lib/trpc/client";
import { offlineFetch } from "./offline-fetch";

mock.module("server-only", () => ({}));

const hookCalls: (Song | Episode)[][] = [];
let downloads = 0;
mock.module("~/components/download-button", () => ({
  useDownloadSongs: (songs: (Song | Episode)[]) => {
    hookCalls.push(songs);
    return {
      isDownloading: false,
      download: () => {
        downloads++;
      },
    };
  },
}));

const { TileMoreButton } =
  await import("../../components/song-list/more-button");

const song = {
  id: "song-1",
  title: "Song 1",
  subtitle: "",
  type: "song",
  perma_url: "https://www.jiosaavn.com/song/song-1/abc",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  more_info: { download_url: "" },
} as unknown as Song;

const queueSong: Queue = {
  queueItemId: "q1",
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

const router = {
  push() {},
  replace() {},
  refresh() {},
  back() {},
  forward() {},
  prefetch() {},
} as unknown as NonNullable<React.ContextType<typeof AppRouterContext>>;

const queryClient = new QueryClient();
const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: offlineFetch,
    }),
  ],
});

/** Renders the more button, opens the desktop dropdown or the phone drawer, and runs `inspect`. */
async function withOpenMenu(
  item: Song | Episode | Queue,
  mobile: boolean,
  inspect: () => Promise<void> | void,
) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <api.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <TileMoreButton item={item} favorites={null} showAlbum={false} />
          </QueryClientProvider>
        </api.Provider>
      </AppRouterContext.Provider>,
    );
  });

  // The first "More options" trigger opens the phone drawer, the last the dropdown.
  const triggers = document.querySelectorAll<HTMLButtonElement>(
    '[aria-label="More options"]',
  );
  await act(async () => {
    triggers[mobile ? 0 : triggers.length - 1]?.click();
  });

  try {
    await inspect();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
}

function findEntry(label: string) {
  return [
    ...document.querySelectorAll<HTMLElement>('[role="menuitem"], button'),
  ].find((el) => el.textContent?.trim() === label);
}

describe("tile more-button download entry", () => {
  beforeEach(() => {
    hookCalls.length = 0;
    downloads = 0;
  });

  it("offers Download for a song in the desktop dropdown and runs the download hook on it", async () => {
    await withOpenMenu(song, false, async () => {
      const entry = findEntry("Download");
      expect(entry).toBeDefined();
      await act(async () => entry?.click());
    });

    expect(hookCalls.at(-1)?.map((s) => s.id)).toEqual(["song-1"]);
    expect(downloads).toBe(1);
  });

  it("offers Download for a song in the phone drawer", async () => {
    await withOpenMenu(song, true, async () => {
      const entry = findEntry("Download");
      expect(entry).toBeDefined();
      await act(async () => entry?.click());
    });

    expect(downloads).toBe(1);
  });

  it("does not offer Download for an episode", async () => {
    const episode = { ...song, type: "episode" } as unknown as Episode;
    await withOpenMenu(episode, false, () => {
      expect(findEntry("Download")).toBeUndefined();
    });
    expect(hookCalls.every((songs) => songs.length === 0)).toBe(true);
  });

  it("does not offer Download for a queue entry, which has no catalog links", async () => {
    await withOpenMenu(queueSong, false, () => {
      expect(findEntry("Download")).toBeUndefined();
    });
  });
});
