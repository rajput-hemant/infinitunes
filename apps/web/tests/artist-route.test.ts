import { describe, expect, it } from "bun:test";

import {
  artistPath,
  legacyArtistPath,
  splitArtistSlug,
  tabForSegment,
} from "../lib/artist-route";

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
