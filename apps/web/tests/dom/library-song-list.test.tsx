import { describe, expect, it, mock } from "bun:test";

import type { Song } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";
import superjson from "superjson";

import { api } from "../../lib/trpc/client";
import { setInputValue } from "./set-input-value";

// `server-only` throws outside the react-server condition; the db action
// module behind the rows only needs it to import, nothing here calls one.
mock.module("server-only", () => ({}));
const { LibrarySongList } =
  await import("../../components/library/library-song-list");

function song(
  id: string,
  title: string,
  artist: string,
  perma = `https://www.jiosaavn.com/song/x/${id}`,
): Song {
  return {
    id,
    type: "song",
    title,
    subtitle: `${title} subtitle`,
    perma_url: perma,
    image: "https://c.saavncdn.com/x-150x150.jpg",
    more_info: {
      artistMap: {
        primary_artists: [
          { id: `a-${id}`, name: artist, perma_url: perma, image: "" },
        ],
      },
    },
  } as unknown as Song;
}

const items = [
  song("s1", "Zebra Song", "Mango Band"),
  song("s2", "Apple Tune", "Zebra Crew"),
  song("s3", "Mango Groove", "Apple Pie"),
];

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

function titles(container: HTMLElement): string[] {
  return [...container.querySelectorAll("li h3")].map(
    (el) => el.textContent ?? "",
  );
}

async function renderList() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <api.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <AudioPlayerProvider>
                <LibrarySongList items={items} />
              </AudioPlayerProvider>
            </QueryClientProvider>
          </api.Provider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return { container, root };
}

describe("LibrarySongList", () => {
  it("keeps server order by default and sorts by title", async () => {
    const { container, root } = await renderList();
    try {
      expect(titles(container)).toEqual([
        "Zebra Song",
        "Apple Tune",
        "Mango Groove",
      ]);

      const select = container.querySelector<HTMLSelectElement>(
        'select[aria-label="Sort songs"]',
      );
      expect(select).not.toBeNull();
      await act(async () => {
        select!.value = "title";
        select!.dispatchEvent(new Event("change", { bubbles: true }));
      });

      expect(titles(container)).toEqual([
        "Apple Tune",
        "Mango Groove",
        "Zebra Song",
      ]);
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("sorts by primary artist and filters by text", async () => {
    const { container, root } = await renderList();
    try {
      const select = container.querySelector<HTMLSelectElement>(
        'select[aria-label="Sort songs"]',
      );
      await act(async () => {
        select!.value = "artist";
        select!.dispatchEvent(new Event("change", { bubbles: true }));
      });

      // Apple Pie < Mango Band < Zebra Crew.
      expect(titles(container)).toEqual([
        "Mango Groove",
        "Zebra Song",
        "Apple Tune",
      ]);

      const filter = container.querySelector<HTMLInputElement>(
        'input[aria-label="Filter songs"]',
      );
      expect(filter).not.toBeNull();
      await act(async () => {
        setInputValue(filter!, "mango");
      });

      // Matches "Mango Groove" (title) and "Zebra Song" (Mango Band artist).
      expect(titles(container)).toEqual(["Mango Groove", "Zebra Song"]);
      expect(container.querySelector("output")?.textContent).toContain(
        "2 of 3",
      );
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });

  it("shows an empty state when nothing matches", async () => {
    const { container, root } = await renderList();
    try {
      const filter = container.querySelector<HTMLInputElement>(
        'input[aria-label="Filter songs"]',
      );
      await act(async () => {
        setInputValue(filter!, "qqq-no-match");
      });

      expect(container.querySelectorAll("li").length).toBe(0);
      expect(container.querySelector("output")?.textContent).toContain(
        "No songs match",
      );
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
