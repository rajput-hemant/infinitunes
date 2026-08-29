import { describe, expect, it } from "bun:test";

import type { MediaType } from "@infinitunes/types";

import {
  getDownloadLink,
  getHref,
  getImageSrc,
  ogImageUrl,
} from "../lib/utils";

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

// Raw JioSaavn artwork: songs/albums/playlists use a `-WxH` token, artist and
// some CDN paths use `_WxH`.
const SONG_IMAGE =
  "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-150x150.jpg";
const ARTIST_IMAGE = "https://c.saavncdn.com/artists/Sia_002_150x150.jpg";

describe("getImageSrc", () => {
  it("returns the raw URL untouched when no quality is requested", () => {
    expect(getImageSrc(SONG_IMAGE)).toBe(SONG_IMAGE);
  });

  it("resizes hyphen-separated resolution tokens", () => {
    expect(getImageSrc(SONG_IMAGE, "high")).toBe(
      "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-500x500.jpg",
    );
    expect(getImageSrc(SONG_IMAGE, "low")).toBe(
      "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-50x50.jpg",
    );
  });

  it("resizes underscore-separated resolution tokens", () => {
    expect(getImageSrc(ARTIST_IMAGE, "high")).toBe(
      "https://c.saavncdn.com/artists/Sia_002_500x500.jpg",
    );
  });

  it("honours an explicit width override", () => {
    expect(getImageSrc(ARTIST_IMAGE, "high", 750)).toContain("_750x750.jpg");
  });

  it("upgrades http to https", () => {
    expect(getImageSrc("http://c.saavncdn.com/a-150x150.jpg", "high")).toBe(
      "https://c.saavncdn.com/a-500x500.jpg",
    );
  });

  it("leaves URLs without a resolution token alone", () => {
    const url = "https://c.saavncdn.com/default.jpg";
    expect(getImageSrc(url, "high")).toBe(url);
  });
});

describe("getDownloadLink", () => {
  const links = [
    "https://aac.saavncdn.com/t/x_12.mp4",
    "https://aac.saavncdn.com/t/x_48.mp4",
    "https://aac.saavncdn.com/t/x_96.mp4",
    "https://aac.saavncdn.com/t/x_160.mp4",
    "https://aac.saavncdn.com/t/x_320.mp4",
  ].join(",");

  it("selects a single URL for the requested stream quality", () => {
    expect(getDownloadLink(links, "poor")).toBe(
      "https://aac.saavncdn.com/t/x_12.mp4",
    );
    expect(getDownloadLink(links, "medium")).toBe(
      "https://aac.saavncdn.com/t/x_96.mp4",
    );
    expect(getDownloadLink(links, "excellent")).toBe(
      "https://aac.saavncdn.com/t/x_320.mp4",
    );
  });

  it("never returns the whole comma-separated list", () => {
    expect(getDownloadLink(links, "high")).not.toContain(",");
  });

  it("falls back to the highest bitrate when quality is unknown", () => {
    expect(getDownloadLink(links)).toBe("https://aac.saavncdn.com/t/x_320.mp4");
  });

  it("returns an empty string when there is no download url", () => {
    expect(getDownloadLink("")).toBe("");
  });
});

describe("ogImageUrl", () => {
  it("decodes HTML entities and encodes params so image survives", () => {
    const url = ogImageUrl({
      title: "Tum Hi Ho &amp; More",
      description: "Aashiqui 2",
      image: SONG_IMAGE,
      square: true,
    });
    const params = new URL(url, "https://x.test").searchParams;
    expect(params.get("title")).toBe("Tum Hi Ho & More");
    expect(params.get("image")).toBe(SONG_IMAGE);
    expect(params.get("square")).toBe("true");
  });

  it("omits square when not requested", () => {
    const url = ogImageUrl({ title: "a", description: "b", image: "c" });
    expect(url).not.toContain("square");
  });
});
