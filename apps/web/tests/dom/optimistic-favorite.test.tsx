import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
import { TooltipProvider } from "@infinitunes/ui/components/tooltip";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { waitFor } from "./wait-for";

type Call = {
  op: "add" | "remove";
  token: string;
  settle: (ok: boolean) => void;
};
const calls: Call[] = [];

function pendingCall(op: Call["op"], token: string) {
  return new Promise<
    { ok: true; data: object } | { ok: false; code: string; message: string }
  >((resolve) => {
    calls.push({
      op,
      token,
      settle: (ok) =>
        resolve(
          ok
            ? { ok: true, data: {} }
            : { ok: false, code: "UNKNOWN", message: "Nope" },
        ),
    });
  });
}

mock.module("~/lib/actions", () => ({
  addToFavorites: (token: string) => pendingCall("add", token),
  removeFromFavorites: (token: string) => pendingCall("remove", token),
}));
const toasts: string[] = [];
mock.module("sonner", () => {
  const promise = (
    p: Promise<unknown>,
    opts: { error?: (e: Error) => string },
  ) => ({
    unwrap: () =>
      p.catch((error: Error) => {
        toasts.push(opts.error ? opts.error(error) : error.message);
        throw error;
      }),
  });
  return {
    toast: Object.assign(() => undefined, {
      promise,
      warning: (m: string) => void toasts.push(m),
    }),
  };
});

const { LikeButton } = await import("../../components/like-button");
const { useTileFavorite } =
  await import("../../components/song-list/more-button-favorite");
const { resetFavoriteOverlay } = await import("../../lib/optimistic-favorite");

const user = { id: "u1" } as never;
const none = {
  songs: [],
  albums: [],
  playlists: [],
  artists: [],
  podcasts: [],
} as unknown as Favorite;
const roots: Root[] = [];

function TileProbe({ favorites }: { favorites: Favorite }) {
  const { isFavorite, like } = useTileFavorite({
    item: { id: "s1", type: "song", name: "S", title: "S" } as never,
    user,
    favorites,
  });
  return (
    <button type="button" data-probe aria-pressed={isFavorite} onClick={like}>
      tile
    </button>
  );
}

async function mount(favorites: Favorite) {
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
          user={user}
          favourites={favorites}
          data-heart="a"
        />
        <LikeButton
          type="song"
          token="s1"
          name="S"
          user={user}
          favourites={favorites}
          data-heart="b"
        />
        <TileProbe favorites={favorites} />
      </TooltipProvider>,
    ),
  );
  return {
    hearts: () => [...container.querySelectorAll<HTMLElement>("[data-heart]")],
    probe: () => container.querySelector<HTMLElement>("[data-probe]"),
    root,
    render: (f: Favorite) =>
      act(async () =>
        root.render(
          <TooltipProvider>
            <LikeButton
              type="song"
              token="s1"
              name="S"
              user={user}
              favourites={f}
              data-heart="a"
            />
            <LikeButton
              type="song"
              token="s1"
              name="S"
              user={user}
              favourites={f}
              data-heart="b"
            />
            <TileProbe favorites={f} />
          </TooltipProvider>,
        ),
      ),
  };
}

const click = (el: Element | null | undefined) =>
  act(async () => (el as HTMLElement).click());

beforeEach(() => {
  calls.length = 0;
  toasts.length = 0;
  resetFavoriteOverlay();
});
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
});

describe("optimistic favorites", () => {
  it("flips every heart for the item on click, before the server answers", async () => {
    const view = await mount(none);
    await click(view.hearts()[0]);

    expect(calls).toHaveLength(1);
    expect(view.hearts().map((h) => h.getAttribute("aria-pressed"))).toEqual([
      "true",
      "true",
    ]);
    expect(view.probe()?.getAttribute("aria-pressed")).toBe("true");
  });

  it("rolls back every heart and reports the error when the write fails", async () => {
    const view = await mount(none);
    await click(view.hearts()[1]);
    await act(async () => calls[0]?.settle(false));
    await waitFor(
      () => view.hearts()[0]?.getAttribute("aria-pressed") === "false",
    );

    expect(view.probe()?.getAttribute("aria-pressed")).toBe("false");
    expect(toasts).toHaveLength(1);
  });

  it("keeps the state through the refresh and settles on the server's value", async () => {
    const view = await mount(none);
    await click(view.hearts()[0]);
    await act(async () => calls[0]?.settle(true));
    // Action done but the refreshed props have not arrived: no flicker back.
    expect(view.hearts()[0]?.getAttribute("aria-pressed")).toBe("true");

    await view.render({ ...none, songs: ["s1"] } as Favorite);
    expect(view.hearts()[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(view.probe()?.getAttribute("aria-pressed")).toBe("true");
  });

  it("sends one write at a time and the latest intent wins on rapid clicks", async () => {
    const view = await mount(none);
    await click(view.hearts()[0]); // like
    await click(view.hearts()[0]); // unlike
    await click(view.hearts()[1]); // like again
    expect(calls).toHaveLength(1);
    expect(view.hearts()[0]?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => calls[0]?.settle(true));
    // The like landed, but the last intent is "liked" as well: nothing more to send.
    await waitFor(
      () => view.hearts()[0]?.getAttribute("aria-pressed") === "true",
    );
    expect(calls).toHaveLength(1);
  });

  it("follows up with the final intent when it differs from what was sent", async () => {
    const view = await mount(none);
    await click(view.hearts()[0]); // like (in flight)
    await click(view.hearts()[0]); // unlike before the first answers
    expect(view.hearts()[0]?.getAttribute("aria-pressed")).toBe("false");

    await act(async () => calls[0]?.settle(true));
    await waitFor(() => calls.length === 2);
    expect(calls.map((c) => c.op)).toEqual(["add", "remove"]);
    await act(async () => calls[1]?.settle(true));
    await waitFor(
      () => view.hearts()[0]?.getAttribute("aria-pressed") === "false",
    );
  });

  it("does not write while the favorites state is unknown", async () => {
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
            user={user}
            favourites={null}
          />
        </TooltipProvider>,
      ),
    );
    await click(container.querySelector("button"));

    expect(calls).toHaveLength(0);
  });
});
