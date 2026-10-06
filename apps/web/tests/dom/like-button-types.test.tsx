import { describe, expect, it } from "bun:test";

import type { MediaType } from "@infinitunes/types";
import { renderToStaticMarkup } from "react-dom/server";

import { LikeButton } from "../../components/like-button";

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

    expect(html).toContain("disabled");
  });
});
