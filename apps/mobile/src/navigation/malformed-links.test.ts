import type { MediaType } from "@infinitunes/types";

import { redirectSystemPath } from "~/app/+native-intent";
import { single } from "~/lib/params";

import { entityHref, entityPath, stationRef } from "./entity-href";

const BASE = "https://www.jiosaavn.com";

describe("entityHref for every type that has a screen", () => {
  const cases: [MediaType, string, string][] = [
    ["album", `${BASE}/album/udta-teer/LHgqn_`, "/album/[name]/[token]"],
    // Live episodes sit under their show's section: /shows/<name>/<token>.
    ["episode", `${BASE}/shows/ep-1/Ub3k_`, "/episode/[name]/[token]"],
    ["label", `${BASE}/label/t-series/pKJp_`, "/label/[name]/[token]"],
    ["mix", `${BASE}/featured/mix/abc_`, "/mix/[name]/[token]"],
    ["playlist", `${BASE}/featured/hits/abc_`, "/playlist/[name]/[token]"],
    ["song", `${BASE}/song/fa9la/KQ0c_`, "/song/[name]/[token]"],
    [
      "radio_station",
      "https://www.saavn.com/s/radio/hindi/Chill",
      "/radio/[name]/[token]",
    ],
  ];

  it.each(cases)("%s opens its own screen", (type, url, pathname) => {
    const href = entityHref(type, url);

    expect(href).toMatchObject({ pathname });
    // The route params are the segments after the type's section.
    expect(href).toMatchObject({
      params: { token: url.split("/").at(-1) },
    });
  });

  it("opens a mix on /mix, not /playlist, and a station on /radio", () => {
    expect(entityHref("mix", `${BASE}/featured/mix/abc_`)).toMatchObject({
      pathname: "/mix/[name]/[token]",
    });
    expect(
      entityHref("radio_station", "https://www.saavn.com/s/radio/hindi/Chill"),
    ).toMatchObject({ pathname: "/radio/[name]/[token]" });
  });

  it("has no screen for types that only list or group things", () => {
    for (const type of ["channel", "season", "unknown"] as const) {
      expect(entityHref(type as MediaType, `${BASE}/x/y/z_`)).toBeUndefined();
    }
  });
});

describe("entityHref and entityPath for malformed input", () => {
  const malformed = [
    "",
    "not a url",
    "https://example.com/album/a/b",
    "https://notjiosaavn.com/album/a/b",
    "https://jiosaavn.com.evil.test/album/a/b",
    `${BASE}`,
    `${BASE}/`,
    `${BASE}/album`,
    `${BASE}//`,
    "ftp://www.jiosaavn.com/album/a/b",
  ];

  it.each(malformed)("is not an album link: %p", (url) => {
    expect(entityHref("album", url)).toBeUndefined();
    expect(entityPath("album", url)).toBeUndefined();
  });

  it("needs a name and a token for an artist, and a season for a show", () => {
    expect(entityHref("artist", `${BASE}/only`)).toBeUndefined();
    expect(entityHref("artist", `${BASE}/artist/only-songs`)).toBeUndefined();
    expect(entityHref("show", `${BASE}/the-show/mXt_`)).toBeUndefined();
    expect(entityHref("show", `${BASE}/shows/the-show/mXt_`)).toBeUndefined();
  });

  it("reads only the type's own section", () => {
    expect(entityHref("album", `${BASE}/song/a/b_`)).toBeUndefined();
    expect(entityHref("album", "/album/only-name")).toBeUndefined();
    expect(entityHref("album", `${BASE}/x/album/a/b_`)).toBeUndefined();
    expect(stationRef("https://www.saavn.com/s/radio/")).toBeUndefined();
    expect(stationRef("https://www.saavn.com/s/radio/hindi")).toBeUndefined();
  });

  it("leaves a label without a token (some albums' label_url) unpressable", () => {
    expect(entityHref("label", "/label/t-series-albums/")).toBeUndefined();
  });

  it("ignores a query string or fragment on a link", () => {
    expect(entityHref("album", `${BASE}/album/a/b_?x=1#frag`)).toMatchObject({
      params: { name: "a", token: "b_" },
    });
  });

  it("opens a relative app path such as a label's url", () => {
    expect(entityHref("label", "/label/t-series/pKJp_")).toMatchObject({
      params: { name: "t-series", token: "pKJp_" },
    });
  });

  it("is not fooled by an artist named like a tab: only a '-songs' suffix selects one", () => {
    expect(entityHref("artist", `${BASE}/artist/songs/LnMf_`)).toEqual({
      pathname: "/artist/[name]/[token]",
      params: { name: "songs", token: "LnMf_" },
    });
    expect(entityHref("artist", `${BASE}/artist/a-bio/LnMf_`)).toMatchObject({
      params: { name: "a", tab: "bio" },
    });
  });

  it("has no station for a URL that is not a JioSaavn one", () => {
    expect(
      stationRef("https://example.com/s/radio/hindi/Chill"),
    ).toBeUndefined();
  });
});

describe("redirectSystemPath for malformed links", () => {
  it.each([
    "",
    "infinitunes://",
    "/",
    "infinitunes:///",
    "?x=1",
    "#frag",
    "/artist",
    "/artist/only-songs",
    "/artist/-songs/tok",
    "/artist/a-songs/tok/extra",
    "/artist/a-songs/tok/songs",
    "/album/a-songs/tok",
  ])("leaves %p untouched", (path) => {
    expect(redirectSystemPath({ path })).toBe(path);
  });

  it("rewrites with any scheme, and drops a query or fragment on the way", () => {
    expect(
      redirectSystemPath({ path: "infinitunes://artist/x-albums/T_#a" }),
    ).toBe("/artist/x/T_/albums");
    expect(redirectSystemPath({ path: "/artist/x-songs/T_?utm=1" })).toBe(
      "/artist/x/T_/songs",
    );
  });

  it("rewrites a slashes-prefixed path", () => {
    expect(redirectSystemPath({ path: "//artist/x-bio/T_" })).toBe(
      "/artist/x/T_/bio",
    );
  });
});

describe("repeated query params", () => {
  it("takes the first value of a repeated key", () => {
    expect(single(["a", "b"])).toBe("a");
    expect(single("a")).toBe("a");
    expect(single(undefined)).toBeUndefined();
    expect(single([])).toBeUndefined();
  });

  it("keeps a repeated key from reaching string methods", () => {
    const repeated = ["1,2", "3"];
    expect(() => single(repeated)?.split(",")).not.toThrow();
    expect(single(repeated)?.trim()).toBe("1,2");
  });
});
