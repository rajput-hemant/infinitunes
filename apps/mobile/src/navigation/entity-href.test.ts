import { creditsHref, entityHref, entityPath, stationRef } from "./entity-href";

describe("creditsHref", () => {
  it("opens only a song's credits, preserving the upstream slug and token", () => {
    expect(
      creditsHref("https://www.jiosaavn.com/song/fa9la/MjsKfz0DbkE"),
    ).toEqual({
      pathname: "/song/[name]/[token]/credits",
      params: { name: "fa9la", token: "MjsKfz0DbkE" },
    });
    expect(
      creditsHref("https://www.jiosaavn.com/album/fa9la/abc"),
    ).toBeUndefined();
    expect(creditsHref("https://example.com/song/fa9la/abc")).toBeUndefined();
  });
});

describe("entityHref", () => {
  it("opens an item at the web's path: its section, name and token", () => {
    expect(
      entityHref("album", "https://www.jiosaavn.com/album/udta-teer/LHgqn_"),
    ).toEqual({
      pathname: "/album/[name]/[token]",
      params: { name: "udta-teer", token: "LHgqn_" },
    });
    expect(
      entityHref("playlist", "https://www.jiosaavn.com/featured/hits/abc_"),
    ).toEqual({
      pathname: "/playlist/[name]/[token]",
      params: { name: "hits", token: "abc_" },
    });
  });

  it("opens an artist on the tab its link names", () => {
    const url = "https://www.jiosaavn.com/artist/flipperachi-songs/LnMf_";
    expect(entityHref("artist", url)).toEqual({
      pathname: "/artist/[name]/[token]/[tab]",
      params: { name: "flipperachi", token: "LnMf_", tab: "songs" },
    });
    expect(
      entityHref("artist", "https://www.jiosaavn.com/artist/flipperachi/LnMf_"),
    ).toEqual({
      pathname: "/artist/[name]/[token]",
      params: { name: "flipperachi", token: "LnMf_" },
    });
  });

  it("keeps a show's season", () => {
    expect(
      entityHref("show", "https://www.jiosaavn.com/shows/the-show/2/mXt_"),
    ).toEqual({
      pathname: "/show/[name]/[season]/[token]",
      params: { name: "the-show", season: "2", token: "mXt_" },
    });
  });

  it("opens a station under /radio", () => {
    expect(
      entityHref(
        "radio_station",
        "https://www.saavn.com/s/radio/hindi-featured-station/Chill-Karo?x=1",
      ),
    ).toEqual({
      pathname: "/radio/[name]/[token]",
      params: { name: "hindi-featured-station", token: "Chill-Karo" },
    });
  });

  it("has no screen for a channel or a URL that is not an item's", () => {
    expect(
      entityHref("channel", "https://www.jiosaavn.com/channel/x/y"),
    ).toBeUndefined();
    expect(
      entityHref("album", "https://example.com/album/a/b"),
    ).toBeUndefined();
  });
});

describe("entityPath", () => {
  it("is the web page's path", () => {
    expect(
      entityPath("show", "https://www.jiosaavn.com/shows/the-show/2/mXt_"),
    ).toBe("/show/the-show/2/mXt_");
    expect(
      entityPath("radio_station", "https://www.saavn.com/s/radio/hindi/Chill"),
    ).toBe("/radio/hindi/Chill");
  });
});

describe("stationRef", () => {
  it("reads the name and token from a station's perma URL", () => {
    expect(
      stationRef("https://www.saavn.com/s/radio/hindi-featured-station/Chill"),
    ).toEqual({ name: "hindi-featured-station", token: "Chill" });
  });

  it("has no station for a URL without a name and a token", () => {
    expect(stationRef("https://www.saavn.com/Chill-Karo")).toBeUndefined();
    expect(stationRef("")).toBeUndefined();
  });
});
