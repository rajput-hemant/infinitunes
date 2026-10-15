import { describe, expect, it } from "bun:test";

import { isUpstreamPlaceholder } from "../components/placeholder-src";

describe("isUpstreamPlaceholder", () => {
  it("recognises JioSaavn's default artist images", () => {
    expect(
      isUpstreamPlaceholder(
        "https://www.jiosaavn.com/_i/3.0/artist-default-film.png",
      ),
    ).toBe(true);
    expect(
      isUpstreamPlaceholder(
        "https://www.jiosaavn.com/_i/3.0/artist-default-music.png",
      ),
    ).toBe(true);
  });

  it("leaves real artwork alone", () => {
    expect(
      isUpstreamPlaceholder(
        "https://c.saavncdn.com/artists/Arijit_150x150.jpg",
      ),
    ).toBe(false);
    expect(isUpstreamPlaceholder(undefined)).toBe(false);
  });
});
