import { describe, expect, it } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SliderCard } from "../components/slider/slider-card";

const ALBUM_URL = "https://www.jiosaavn.com/album/night-drive/abc123";

function render(overrides: { hidePlayButton?: boolean } = {}) {
  return renderToStaticMarkup(
    createElement(SliderCard, {
      name: "Night Drive",
      type: "album",
      url: ALBUM_URL,
      image: "https://c.saavncdn.com/x-150x150.jpg",
      ...overrides,
    }),
  );
}

describe("slider card", () => {
  it("links the title to the item page", () => {
    expect(render({ hidePlayButton: true })).toMatch(
      /<a [^>]*href="\/album\/night-drive\/abc123"[^>]*><span class="truncate">Night Drive<\/span><\/a>/,
    );
  });

  it("omits the play button when hidden", () => {
    expect(render({ hidePlayButton: true })).not.toContain(
      'aria-label="Play Night Drive"',
    );
  });
});
