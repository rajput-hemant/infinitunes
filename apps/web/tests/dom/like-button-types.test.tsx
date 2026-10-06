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
  ] as const)("renders nothing for %s", (type) => {
    expect(render(type)).toBe("");
  });

  it.each(["song", "album", "playlist", "artist", "show"] as const)(
    "renders the like control for %s",
    (type) => {
      expect(render(type)).toContain('aria-label="Like"');
    },
  );
});
