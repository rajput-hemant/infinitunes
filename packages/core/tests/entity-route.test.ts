import { describe, expect, it } from "bun:test";

import {
  artistPath,
  entityRoute,
  entityRoutePath,
  legacyArtistPath,
  splitArtistSlug,
  tabForSegment,
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

describe("entityRoute", () => {
  it("reads the name and token of a perma URL, whatever its section", () => {
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
      name: "outlaw-productions-albums",
      token: "pKJp4RENQb4_",
    });
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
});
