import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
import { TooltipProvider } from "@infinitunes/ui/components/tooltip";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const writes: { settle: () => void }[] = [];
mock.module("~/lib/actions", () => ({
  addToFavorites: () =>
    new Promise((resolve) =>
      writes.push({ settle: () => resolve({ ok: true, data: {} }) }),
    ),
  removeFromFavorites: () => Promise.resolve({ ok: true, data: {} }),
}));

const { LikeButton } = await import("../../components/like-button");
const { claimOptimisticOwner, resetOptimisticState } =
  await import("@infinitunes/core/optimistic-owner");
const { favoriteKey, toggleFavorite, useFavorite, resetFavoriteOverlay } =
  await import("@infinitunes/core/react/optimistic-favorite");

const none = {
  songs: [],
  albums: [],
  playlists: [],
  artists: [],
  podcasts: [],
} as unknown as Favorite;
const roots: Root[] = [];

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () =>
    root.render(
      <TooltipProvider>
        <LikeButton
          type="song"
          token="s1"
          name="S"
          user={{ id: "u" } as never}
          favourites={none}
        />
      </TooltipProvider>,
    ),
  );
  return container.querySelector("button");
}

beforeEach(() => {
  writes.length = 0;
  resetFavoriteOverlay();
});
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
});

describe("optimistic state across accounts", () => {
  it("clears pending likes when the signed-in user changes or signs out", async () => {
    claimOptimisticOwner("user-a");
    const button = await mount();
    await act(async () => button?.click());
    expect(button?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => claimOptimisticOwner("user-b"));
    expect(button?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => button?.click());
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    await act(async () => resetOptimisticState());
    expect(button?.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("favorite expiry timers", () => {
  it("keeps one timer per entry: a newer write is not cut short by an older timer", async () => {
    const realSet = globalThis.setTimeout;
    const timers: { fn: () => void; handle: number; cleared: boolean }[] = [];
    let next = 1000;
    globalThis.setTimeout = ((fn: () => void, ms?: number) => {
      if (ms === 8000) {
        const t = { fn, handle: next++, cleared: false };
        timers.push(t);
        return t.handle;
      }
      return realSet(fn, ms);
    }) as unknown as typeof setTimeout;
    const realClear = globalThis.clearTimeout;
    globalThis.clearTimeout = ((h: number) => {
      const t = timers.find((x) => x.handle === h);
      if (t) t.cleared = true;
      else realClear(h);
    }) as unknown as typeof clearTimeout;

    try {
      const key = favoriteKey("song", "t");
      const send = () => Promise.resolve();
      toggleFavorite({ key, serverLiked: false, send });
      await act(async () => new Promise((r) => realSet(r, 10)));
      toggleFavorite({ key, serverLiked: false, send });
      await act(async () => new Promise((r) => realSet(r, 10)));

      expect(timers.length).toBe(2);
      expect(timers[0]?.cleared).toBe(true);
      expect(timers[1]?.cleared).toBe(false);
    } finally {
      globalThis.setTimeout = realSet;
      globalThis.clearTimeout = realClear;
      resetFavoriteOverlay();
    }
    expect(typeof useFavorite).toBe("function");
  });
});
