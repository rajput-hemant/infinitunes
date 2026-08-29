import { describe, expect, it } from "bun:test";

import type { MediaType } from "@infinitunes/types";

import { getHref } from "../lib/utils";

describe("getHref", () => {
  it("normalizes non-canonical internal-site.jiosaavn.com album URL with /s/<lang>/ prefix", () => {
    expect(
      getHref(
        "https://internal-site.jiosaavn.com/s/album/hindi/dhurandhar-the-revenge-2026/fzGxJ2eyORk_",
        "album",
      ),
    ).toBe("/album/dhurandhar-the-revenge-2026/fzGxJ2eyORk_");
  });

  it("normalizes staging.jiosaavn.com artist URL", () => {
    expect(
      getHref(
        "https://staging.jiosaavn.com/artist/arijit-singh-songs/LlRWpHzy3Hk_",
        "artist",
      ),
    ).toBe("/artist/arijit-singh-songs/LlRWpHzy3Hk_");
  });

  it("normalizes legacy saavn.com radio station URL with /s/ prefix", () => {
    expect(
      getHref(
        "https://www.saavn.com/s/radio/hindi-featured-station/Chill",
        "radio_station",
      ),
    ).toBe("/radio_station/hindi-featured-station/Chill");
  });

  it("handles canonical www.jiosaavn.com album URL without change to trailing segments", () => {
    expect(
      getHref(
        "https://www.jiosaavn.com/album/fallen-angel-digital-ep/QTqp3RbJZb4_",
        "album",
      ),
    ).toBe("/album/fallen-angel-digital-ep/QTqp3RbJZb4_");
  });

  it("strips /s/<lang>/ from canonical www.jiosaavn.com URL", () => {
    expect(
      getHref("https://www.jiosaavn.com/s/album/hindi/x-2026/tok_", "album"),
    ).toBe("/album/x-2026/tok_");
  });

  it("normalizes playlist URL with /featured/ entity segment", () => {
    expect(
      getHref(
        "https://www.jiosaavn.com/featured/romantic-hits/abc_",
        "playlist",
      ),
    ).toBe("/playlist/romantic-hits/abc_");
  });

  it("keeps 3 trailing segments for show type (name, season, token)", () => {
    expect(
      getHref("https://www.jiosaavn.com/shows/the-ranveer-show/1/abc_", "show"),
    ).toBe("/show/the-ranveer-show/1/abc_");
  });

  it("handles http scheme", () => {
    expect(getHref("http://www.jiosaavn.com/album/x/abc_", "album")).toBe(
      "/album/x/abc_",
    );
  });

  it("returns relative path unchanged without double-prefixing or failing", () => {
    expect(getHref("/album/x/abc_", "album")).toBe("/album/x/abc_");
  });

  it("returns # for empty, undefined, or null input", () => {
    expect(getHref("", "album")).toBe("#");
    expect(getHref(undefined, "album")).toBe("#");
    expect(getHref(null, "album")).toBe("#");
  });

  it("returns # for non-jiosaavn / non-saavn external URLs", () => {
    expect(getHref("https://example.com/album/foo/bar", "album")).toBe("#");
    expect(getHref("https://google.com/search?q=test", "song")).toBe("#");
  });

  it("returns # when path lacks required segment count", () => {
    expect(getHref("https://www.jiosaavn.com/", "album")).toBe("#");
    expect(getHref("https://www.jiosaavn.com/album", "album")).toBe("#");
    expect(getHref("https://www.jiosaavn.com/shows/test-show", "show")).toBe(
      "#",
    );
  });

  it("ignores query strings and URL fragments when extracting segments", () => {
    expect(
      getHref(
        "https://www.jiosaavn.com/album/test-album/tok_?lang=hindi#details",
        "album",
      ),
    ).toBe("/album/test-album/tok_");
  });
});

describe("route-arity invariant", () => {
  const ROUTES = [
    "/album/[name]/[token]",
    "/artist/[name]/[token]",
    "/playlist/[name]/[token]",
    "/song/[name]/[token]",
    "/show/[name]/[season]/[token]",
    "/episode/[name]/[token]",
    "/label/[name]/[token]",
    "/mix/[name]/[token]",
    "/radio/[name]/[token]",
  ];

  function matchesSomeRoute(path: string) {
    const segs = path.split("?")[0].split("/").filter(Boolean);
    return ROUTES.some((r) => {
      const rs = r.split("/").filter(Boolean);
      return (
        rs.length === segs.length &&
        rs.every((s, i) => s.startsWith("[") || s === segs[i])
      );
    });
  }

  const sampleInputs: { url: string; type: MediaType }[] = [
    {
      url: "https://internal-site.jiosaavn.com/s/album/hindi/dhurandhar-the-revenge-2026/fzGxJ2eyORk_",
      type: "album",
    },
    {
      url: "https://staging.jiosaavn.com/artist/arijit-singh-songs/LlRWpHzy3Hk_",
      type: "artist",
    },
    {
      url: "https://www.jiosaavn.com/album/fallen-angel-digital-ep/QTqp3RbJZb4_",
      type: "album",
    },
    {
      url: "https://www.jiosaavn.com/s/album/hindi/x-2026/tok_",
      type: "album",
    },
    {
      url: "https://www.jiosaavn.com/featured/romantic-hits/abc_",
      type: "playlist",
    },
    {
      url: "https://www.jiosaavn.com/shows/the-ranveer-show/1/abc_",
      type: "show",
    },
    {
      url: "http://www.jiosaavn.com/song/track-title/xyz_",
      type: "song",
    },
    {
      url: "https://www.jiosaavn.com/episode/podcast-ep/ep123_",
      type: "episode",
    },
    {
      url: "https://www.jiosaavn.com/mix/dance-mix/mix123_",
      type: "mix",
    },
    {
      url: "https://www.jiosaavn.com/label/music-label/lbl123_",
      type: "label",
    },
    {
      url: "https://www.jiosaavn.com/radio/hindi-radio/rad123_",
      type: "radio",
    },
  ];

  for (const { url, type } of sampleInputs) {
    it(`guarantees valid route arity for ${type} from ${url}`, () => {
      const href = getHref(url, type);
      expect(matchesSomeRoute(href)).toBe(true);
    });
  }
});
