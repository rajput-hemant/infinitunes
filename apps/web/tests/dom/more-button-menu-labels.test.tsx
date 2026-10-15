import { describe, expect, it, mock } from "bun:test";

import type { Queue } from "@infinitunes/types";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import type React from "react";
import { createRoot } from "react-dom/client";

import { waitFor } from "./wait-for";

mock.module("server-only", () => ({}));

const { TileMoreButton } =
  await import("../../components/song-list/more-button");

const longArtist =
  "A Very Long Artist Name That Keeps Going Forever And Ever And Ever";

// A queue entry carries its artists directly, so the "More From" link is
// rendered from `artists`.
const track: Queue = {
  queueItemId: "q1",
  id: "song-1",
  name: "Song 1",
  subtitle: "Artist",
  url: "https://www.jiosaavn.com/song/song-1/abc",
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  artists: [
    {
      id: "artist-1",
      name: longArtist,
      perma_url: "https://www.jiosaavn.com/artist/a/abc",
    },
  ],
  download_url: "",
  duration: 100,
} as unknown as Queue;

const router = {
  push() {},
  replace() {},
  refresh() {},
  back() {},
  forward() {},
  prefetch() {},
} as unknown as NonNullable<React.ContextType<typeof AppRouterContext>>;

/** Renders the player-style menu, opens the desktop dropdown and runs `inspect`. */
async function withOpenDesktopMenu(inspect: () => void) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <TileMoreButton item={track} favorites={null} showAlbum />
      </AppRouterContext.Provider>,
    );
  });

  // The last trigger is the desktop dropdown; the first is the phone drawer.
  const triggers = document.querySelectorAll<HTMLButtonElement>(
    '[aria-label="More options"]',
  );
  await act(async () => {
    triggers[triggers.length - 1]?.click();
  });
  // The menu is its own chunk: the click starts the import and opens it on arrival.
  await waitFor(
    () =>
      document.querySelector('[role="menuitem"], [data-slot=drawer-popup]') !==
      null,
  );

  try {
    inspect();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
}

describe("tile more-button menu labels", () => {
  it("keeps each desktop label in a single truncating span with the full text as its title", async () => {
    await withOpenDesktopMenu(() => {
      const label = `More From ${longArtist}`;
      const span = [
        ...document.querySelectorAll<HTMLElement>("span[title]"),
      ].find((el) => el.textContent === label);
      expect(span).toBeDefined();
      expect(span?.getAttribute("title")).toBe(label);
      expect(span?.className).toContain("truncate");
    });
  });

  it("gives the play and queue entries the same truncating label", async () => {
    await withOpenDesktopMenu(() => {
      const playNow = [
        ...document.querySelectorAll<HTMLElement>("span[title]"),
      ].find((el) => el.textContent === "Play Song Now");
      expect(playNow?.getAttribute("title")).toBe("Play Song Now");
      expect(playNow?.className).toContain("truncate");
    });
  });
});
