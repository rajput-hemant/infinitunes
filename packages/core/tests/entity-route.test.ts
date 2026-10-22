import { describe, expect, it } from "bun:test";

import {
  artistPath,
  entityRoute,
  entityRoutePath,
  labelPath,
  labelTabForSegment,
  legacyArtistPath,
  legacyLabelPath,
  splitArtistSlug,
  splitLabelSlug,
  tabForSegment,
  type EntityRoute,
} from "../src/entity-route";

describe("splitArtistSlug", () => {
  it("reads the tab out of a legacy name slug", () => {
    expect(splitArtistSlug("himesh-reshammiya-songs")).toEqual({
      name: "himesh-reshammiya",
      tab: "songs",
    });
    expect(splitArtistSlug("himesh-reshammiya-albums").tab).toBe("albums");
    expect(splitArtistSlug("himesh-reshammiya-bio").tab).toBe("bio");
  });

  it("leaves a plain name on the Overview tab", () => {
    expect(splitArtistSlug("himesh-reshammiya")).toEqual({
      name: "himesh-reshammiya",
      tab: "overview",
    });
  });

  it("only strips one trailing tab suffix", () => {
    expect(splitArtistSlug("the-songs-songs")).toEqual({
      name: "the-songs",
      tab: "songs",
    });
  });

  it("never reduces a name to nothing", () => {
    expect(splitArtistSlug("-songs").name).toBe("-songs");
    expect(splitArtistSlug("songs").name).toBe("songs");
  });
});

describe("artistPath", () => {
  it("puts the tab in a child segment, Overview on the bare route", () => {
    expect(artistPath("a-b", "tok_", "overview")).toBe("/artist/a-b/tok_");
    expect(artistPath("a-b", "tok_", "songs")).toBe("/artist/a-b/tok_/songs");
    expect(artistPath("a-b", "tok_", "bio")).toBe("/artist/a-b/tok_/bio");
  });
});

describe("tabForSegment", () => {
  it("maps the selected child segment to a tab", () => {
    expect(tabForSegment(null)).toBe("overview");
    expect(tabForSegment("songs")).toBe("songs");
    expect(tabForSegment("albums")).toBe("albums");
    expect(tabForSegment("bio")).toBe("bio");
    expect(tabForSegment("other")).toBe("overview");
  });
});

describe("legacyArtistPath", () => {
  it("maps every old slug URL onto its tab route", () => {
    expect(legacyArtistPath("/artist/himesh-reshammiya-songs/tok_")).toBe(
      "/artist/himesh-reshammiya/tok_/songs",
    );
    expect(legacyArtistPath("/artist/himesh-reshammiya-albums/tok_")).toBe(
      "/artist/himesh-reshammiya/tok_/albums",
    );
    expect(legacyArtistPath("/artist/himesh-reshammiya-bio/tok_")).toBe(
      "/artist/himesh-reshammiya/tok_/bio",
    );
  });

  it("ignores everything that is already a current URL", () => {
    expect(legacyArtistPath("/artist/himesh-reshammiya/tok_")).toBeNull();
    expect(legacyArtistPath("/artist/himesh-reshammiya/tok_/songs")).toBeNull();
    expect(legacyArtistPath("/artist")).toBeNull();
    expect(legacyArtistPath("/album/x-songs/tok_")).toBeNull();
  });
});

describe("splitLabelSlug", () => {
  it("reads the tab out of JioSaavn's label slug", () => {
    expect(splitLabelSlug("t-series-albums")).toEqual({
      name: "t-series",
      tab: "albums",
    });
    expect(splitLabelSlug("t-series-songs")).toEqual({
      name: "t-series",
      tab: "songs",
    });
  });

  it("leaves a plain name on the Songs tab, and never empties it", () => {
    expect(splitLabelSlug("music-label")).toEqual({
      name: "music-label",
      tab: "songs",
    });
    expect(splitLabelSlug("-albums").name).toBe("-albums");
    expect(splitLabelSlug("t-series-bio")).toEqual({
      name: "t-series-bio",
      tab: "songs",
    });
  });
});

describe("labelPath", () => {
  it("puts Albums in a child segment, Songs on the bare route", () => {
    expect(labelPath("t-series", "tok_", "songs")).toBe("/label/t-series/tok_");
    expect(labelPath("t-series", "tok_", "albums")).toBe(
      "/label/t-series/tok_/albums",
    );
  });
});

describe("labelTabForSegment", () => {
  it("maps the selected child segment to a tab", () => {
    expect(labelTabForSegment(null)).toBe("songs");
    expect(labelTabForSegment("albums")).toBe("albums");
    expect(labelTabForSegment("songs")).toBe("songs");
    expect(labelTabForSegment("bio")).toBe("songs");
  });
});

describe("legacyLabelPath", () => {
  it("maps both slug suffixes onto the tab routes", () => {
    expect(legacyLabelPath("/label/outlaw-productions-albums/tok_")).toBe(
      "/label/outlaw-productions/tok_/albums",
    );
    expect(legacyLabelPath("/label/outlaw-productions-songs/tok_")).toBe(
      "/label/outlaw-productions/tok_",
    );
  });

  it("ignores everything that is already a current URL", () => {
    expect(legacyLabelPath("/label/music-label/tok_")).toBeNull();
    expect(legacyLabelPath("/label/music-label/tok_/albums")).toBeNull();
    expect(legacyLabelPath("/label/t-series-albums")).toBeNull();
    expect(legacyLabelPath("/artist/x-albums/tok_")).toBeNull();
  });
});

describe("entityRoute", () => {
  it("reads the name and token after the type's own section", () => {
    expect(
      entityRoute(
        "https://www.jiosaavn.com/featured/romantic-hits/abc_",
        "playlist",
      ),
    ).toEqual({
      kind: "entity",
      type: "playlist",
      name: "romantic-hits",
      token: "abc_",
    });
  });

  it("splits an artist's tab off the name slug", () => {
    expect(
      entityRoute(
        "https://www.jiosaavn.com/artist/arijit-singh-songs/LlRW_",
        "artist",
      ),
    ).toEqual({
      kind: "artist",
      name: "arijit-singh",
      token: "LlRW_",
      tab: "songs",
    });
  });

  it("keeps a show's season", () => {
    expect(
      entityRoute(
        "https://www.jiosaavn.com/shows/the-ranveer-show/2/abc_",
        "show",
      ),
    ).toEqual({
      kind: "show",
      name: "the-ranveer-show",
      season: "2",
      token: "abc_",
    });
  });

  it("reads app-relative paths such as a song's label URL", () => {
    expect(
      entityRoute("/label/outlaw-productions-albums/pKJp4RENQb4_", "label"),
    ).toEqual({
      kind: "entity",
      type: "label",
      name: "outlaw-productions",
      token: "pKJp4RENQb4_",
      tab: "albums",
    });
  });

  it("splits a label's tab off the name slug, Songs by default", () => {
    expect(
      entityRoute(
        "https://www.jiosaavn.com/label/outlaw-productions-songs/tok_",
        "label",
      ),
    ).toEqual({
      kind: "entity",
      type: "label",
      name: "outlaw-productions",
      token: "tok_",
      tab: "songs",
    });
    expect(
      entityRoute(
        "https://www.jiosaavn.com/label/music-label/lbl123_",
        "label",
      ),
    ).toEqual({
      kind: "entity",
      type: "label",
      name: "music-label",
      token: "lbl123_",
      tab: "songs",
    });
  });

  it("reads the app's own label Albums route", () => {
    expect(entityRoute("/label/t-series/tok_/albums", "label")).toEqual({
      kind: "entity",
      type: "label",
      name: "t-series",
      token: "tok_",
      tab: "albums",
    });
    expect(entityRoute("/label/t-series/tok_/songs", "label")).toBeUndefined();
    expect(entityRoute("/label/t-series/tok_/bio", "label")).toBeUndefined();
  });

  it("refuses other sites and URLs too short for the type", () => {
    expect(
      entityRoute("https://example.com/album/a/b", "album"),
    ).toBeUndefined();
    expect(
      entityRoute("https://www.jiosaavn.com/shows/test-show", "show"),
    ).toBeUndefined();
    expect(entityRoute("", "album")).toBeUndefined();
  });

  it("reads JioSaavn's /s/ sections, with one qualifier before the name", () => {
    expect(
      entityRoute(
        "https://www.jiosaavn.com/s/album/hindi/x-2026/tok_",
        "album",
      ),
    ).toEqual({ kind: "entity", type: "album", name: "x-2026", token: "tok_" });
    expect(
      entityRoute(
        "https://www.jiosaavn.com/s/playlist/0a1b2c/road-trip/Fp_",
        "playlist",
      ),
    ).toEqual({
      kind: "entity",
      type: "playlist",
      name: "road-trip",
      token: "Fp_",
    });
    expect(
      entityRoute(
        "https://www.saavn.com/s/radio/hindi-featured-station/Bhajan-Sagar",
        "radio_station",
      ),
    ).toEqual({
      kind: "entity",
      type: "radio_station",
      name: "hindi-featured-station",
      token: "Bhajan-Sagar",
    });
    // A qualifier is only JioSaavn's, under /s/.
    expect(
      entityRoute("https://www.jiosaavn.com/album/hindi/x/tok_", "album"),
    ).toBeUndefined();
    expect(
      entityRoute("https://www.jiosaavn.com/s/album/a/b/c/tok_", "album"),
    ).toBeUndefined();
  });

  it("reads an episode under its show's section, and the app's own path", () => {
    const episode: EntityRoute = {
      kind: "entity",
      type: "episode",
      name: "ep-1",
      token: "E_",
    };
    expect(
      entityRoute("https://www.jiosaavn.com/shows/ep-1/E_", "episode"),
    ).toEqual(episode);
    expect(entityRoute("/episode/ep-1/E_", "episode")).toEqual(episode);
    // A show's (season's) link is not an episode.
    expect(
      entityRoute("https://www.jiosaavn.com/shows/the-show/1/S_", "episode"),
    ).toBeUndefined();
  });

  it("reads the app's own artist tab route", () => {
    expect(entityRoute("/artist/arijit-singh/LlRW_/albums", "artist")).toEqual({
      kind: "artist",
      name: "arijit-singh",
      token: "LlRW_",
      tab: "albums",
    });
    expect(entityRoute("/artist/a/LlRW_/extra", "artist")).toBeUndefined();
  });

  it("refuses a path in another section, or with the section read as the name", () => {
    expect(entityRoute("/album/only-name", "album")).toBeUndefined();
    expect(entityRoute("/s/radio/", "radio")).toBeUndefined();
    expect(entityRoute("/s/radio/hindi", "radio_station")).toBeUndefined();
    expect(
      entityRoute("https://www.jiosaavn.com/song/a/tok_", "album"),
    ).toBeUndefined();
    expect(entityRoute("/label/t-series-albums/", "label")).toBeUndefined();
    expect(
      entityRoute("https://www.jiosaavn.com/shows/x/1/tok_", "season"),
    ).toBeUndefined();
  });
});

describe("entityRoutePath", () => {
  it("builds the shared app path for each route shape", () => {
    expect(
      entityRoutePath({
        kind: "entity",
        type: "album",
        name: "a",
        token: "t_",
      }),
    ).toBe("/album/a/t_");
    expect(
      entityRoutePath({ kind: "show", name: "s", season: "3", token: "t_" }),
    ).toBe("/show/s/3/t_");
    expect(
      entityRoutePath({ kind: "artist", name: "a", token: "t_", tab: "bio" }),
    ).toBe("/artist/a/t_/bio");
  });

  it("links a label's tab route", () => {
    expect(
      entityRoutePath({
        kind: "entity",
        type: "label",
        name: "l",
        token: "t_",
        tab: "albums",
      }),
    ).toBe("/label/l/t_/albums");
    expect(
      entityRoutePath({
        kind: "entity",
        type: "label",
        name: "l",
        token: "t_",
        tab: "songs",
      }),
    ).toBe("/label/l/t_");
  });
});
