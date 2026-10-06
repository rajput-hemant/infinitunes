import { describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
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
  subtitle = `${title} subtitle`,
  perma = `https://www.jiosaavn.com/song/x/${id}`,
): Song {
  return {
    id,
    type: "song",
    title,
    subtitle,
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

type ListProps = Partial<React.ComponentProps<typeof LibrarySongList>>;

async function renderList(props: ListProps = {}, list: Song[] = items) {
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
                <LibrarySongList items={list} {...props} />
              </AudioPlayerProvider>
            </QueryClientProvider>
          </api.Provider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return { container, root };
}

async function setSort(container: HTMLElement, value: string) {
  const select = container.querySelector<HTMLSelectElement>(
    'select[aria-label="Sort songs"]',
  );
  await act(async () => {
    select!.value = value;
    select!.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function setFilter(container: HTMLElement, value: string) {
  const filter = container.querySelector<HTMLInputElement>(
    'input[aria-label="Filter songs"]',
  );
  await act(async () => {
    setInputValue(filter!, value);
  });
}

async function withList(
  run: (container: HTMLElement) => Promise<void>,
  props: ListProps = {},
  list: Song[] = items,
) {
  const { container, root } = await renderList(props, list);
  try {
    await run(container);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
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

  it("matches case-insensitively", () =>
    withList(async (container) => {
      await setFilter(container, "MANGO");
      expect(titles(container)).toEqual(["Zebra Song", "Mango Groove"]);
    }));

  it("matches entity-encoded subtitles and artist names", () =>
    withList(
      async (container) => {
        await setFilter(container, "rock & roll");
        expect(titles(container)).toEqual(["Plain Title"]);

        await setFilter(container, "simon & garfunkel");
        expect(titles(container)).toEqual(["Plain Title"]);
      },
      {},
      [
        song(
          "e1",
          "Plain Title",
          "Simon &amp; Garfunkel",
          "Rock &amp; Roll Vol 1",
        ),
        song("e2", "Other Title", "Someone"),
      ],
    ));

  it("sorts by decoded entity-encoded titles and artists", () =>
    withList(
      async (container) => {
        await setSort(container, "artist");
        // "AC & DC" decodes before "Bee", "AC &amp; DC" would sort after it.
        expect(titles(container)).toEqual(["Second", "First"]);
      },
      {},
      [song("e1", "First", "Bee"), song("e2", "Second", "AC &amp; DC")],
    ));

  it("ignores diacritics in the query and the data", () =>
    withList(
      async (container) => {
        await setFilter(container, "beyonce");
        expect(titles(container)).toEqual(["Halo"]);

        await setFilter(container, "BEYONCÉ");
        expect(titles(container)).toEqual(["Halo"]);
      },
      {},
      [song("d1", "Halo", "Beyoncé"), song("d2", "Other", "Someone")],
    ));

  it("restores the original order when sort returns to default", () =>
    withList(async (container) => {
      await setSort(container, "title");
      await setSort(container, "recent");
      expect(titles(container)).toEqual([
        "Zebra Song",
        "Apple Tune",
        "Mango Groove",
      ]);
      expect(items.map((i) => i.id)).toEqual(["s1", "s2", "s3"]);
    }));

  it("labels the default sort per page", () =>
    withList(
      async (container) => {
        expect(
          container.querySelector('option[value="recent"]')?.textContent,
        ).toBe("Recently played");
      },
      { recentLabel: "Recently played" },
    ));

  it("shows the count only while filtering", () =>
    withList(async (container) => {
      expect(container.querySelector("output")).toBeNull();

      await setSort(container, "title");
      expect(container.querySelector("output")).toBeNull();

      await setFilter(container, "mango");
      expect(container.querySelector("output")?.textContent).toContain(
        "2 of 3",
      );

      await setFilter(container, "");
      expect(container.querySelector("output")).toBeNull();
    }));

  it("offers Play All for the visible list", () =>
    withList(async (container) => {
      const label = () =>
        [...container.querySelectorAll("button")]
          .map((b) => b.textContent)
          .find((t) => t?.includes("Play"));

      expect(label()).toContain("Play All");
      await setFilter(container, "mango");
      expect(label()).toContain("Play 2 shown");
    }));

  it("disables like and hides the favourite action when favorites failed to load", () =>
    withList(
      async (container) => {
        const like = container.querySelector<HTMLButtonElement>(
          '[aria-label="Like"]',
        );
        expect(like?.hasAttribute("data-trigger-disabled")).toBe(true);

        const triggers = document.querySelectorAll<HTMLButtonElement>(
          '[aria-label="More Options"]',
        );
        await act(async () => {
          triggers[triggers.length - 1]?.click();
        });
        const labels = [...document.querySelectorAll('[role="menuitem"]')].map(
          (el) => el.textContent,
        );
        expect(labels).toContain("Add to Queue");
        expect(labels).not.toContain("Add To Favourite");
        expect(labels).not.toContain("Remove From Favourite");
      },
      { userFavorites: null },
    ));

  it("keeps the like control enabled when the user has no favorites row", () =>
    withList(
      async (container) => {
        const like = container.querySelector<HTMLButtonElement>(
          '[aria-label="Like"]',
        );
        expect(like).not.toBeNull();
        expect(like?.hasAttribute("data-trigger-disabled")).toBe(false);
      },
      { userFavorites: undefined as Favorite | undefined },
    ));
});
