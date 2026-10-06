import { describe, expect, it, mock } from "bun:test";

import type { MediaType } from "@infinitunes/types";
import { TooltipProvider } from "@infinitunes/ui/components/tooltip";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const writes: string[] = [];
const queries = await import("~/lib/db/queries");
mock.module("~/lib/db/queries", () => ({
  ...queries,
  addToFavorites: async () => void writes.push("add"),
  removeFromFavorites: async () => void writes.push("remove"),
}));

const { LikeButton } = await import("../../components/like-button");

function render(type: MediaType) {
  return renderToStaticMarkup(<LikeButton type={type} token="t" name="Name" />);
}

// CD-7: media types without a favorites column must render nothing, not a heart.
describe("LikeButton by media type", () => {
  it.each([
    "radio_station",
    "radio",
    "mix",
    "episode",
    "channel",
    "label",
    // Not likable itself: DetailsHeader maps `season` to "show" before it
    // reaches LikeButton (type={kind === "season" ? "show" : kind}).
    "season",
  ] as const)("renders nothing for %s", (type) => {
    expect(render(type)).toBe("");
  });

  it.each(["song", "album", "playlist", "artist", "show"] as const)(
    "renders the like control for %s",
    (type) => {
      expect(render(type)).toContain('aria-label="Like"');
    },
  );

  // A failed favorites read (null) is "unknown", not "not liked": the button
  // must not offer a write it cannot do correctly.
  it("disables the control when favorites could not be loaded", () => {
    const html = renderToStaticMarkup(
      <LikeButton type="song" token="t" name="Name" favourites={null} />,
    );

    expect(html).toContain('aria-disabled="true"');
  });
});

describe("LikeButton when favorites could not be loaded", () => {
  async function mount() {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <TooltipProvider>
          <LikeButton
            user={{ id: "u" } as never}
            type="song"
            token="t"
            name="Name"
            favourites={null}
          />
        </TooltipProvider>,
      );
    });
    const trigger = container.querySelector<HTMLButtonElement>(
      '[aria-label="Like"]',
    );
    return {
      trigger,
      cleanup: async () => {
        await act(async () => root.unmount());
        container.remove();
      },
    };
  }

  it("does not write when clicked", async () => {
    writes.length = 0;
    const { trigger, cleanup } = await mount();

    await act(async () => trigger?.click());

    expect(writes).toEqual([]);
    await cleanup();
  });

  it("explains why the control is unavailable in its tooltip", async () => {
    const { trigger, cleanup } = await mount();

    await act(async () => {
      trigger?.focus();
      trigger?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("Couldn't load your favorites");
    await cleanup();
  });
});
