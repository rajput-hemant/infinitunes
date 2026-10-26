import { redirectSystemPath } from "~/app/+native-intent";

describe("redirectSystemPath", () => {
  it("maps a legacy artist link onto its tab route", () => {
    expect(
      redirectSystemPath({
        path: "infinitunes://artist/flipperachi-songs/LnMf_?ref=share",
      }),
    ).toBe("/artist/flipperachi/LnMf_/songs");
    expect(redirectSystemPath({ path: "/artist/flipperachi-bio/LnMf_" })).toBe(
      "/artist/flipperachi/LnMf_/bio",
    );
  });

  it("leaves every other link as it came", () => {
    for (const path of [
      "infinitunes://album/udta-teer/LHgqn_",
      "/artist/flipperachi/LnMf_/songs",
      "/searches",
    ]) {
      expect(redirectSystemPath({ path })).toBe(path);
    }
  });

  it("opens a search link in the Search tab, keeping its query", () => {
    expect(redirectSystemPath({ path: "infinitunes://search?q=arijit" })).toBe(
      "/(tabs)/(search)/search?q=arijit",
    );
    expect(redirectSystemPath({ path: "/search" })).toBe(
      "/(tabs)/(search)/search",
    );
  });

  it("tolerates trailing slashes and the web's /search/<type> shape", () => {
    expect(redirectSystemPath({ path: "/search/" })).toBe(
      "/(tabs)/(search)/search",
    );
    expect(redirectSystemPath({ path: "infinitunes://search///?q=a" })).toBe(
      "/(tabs)/(search)/search?q=a",
    );
    expect(redirectSystemPath({ path: "/search/songs?q=arijit%20singh" })).toBe(
      "/(tabs)/(search)/search?q=arijit%20singh",
    );
    // Deeper or unrelated paths stay as they came.
    expect(redirectSystemPath({ path: "/search/songs/extra?q=a" })).toBe(
      "/search/songs/extra?q=a",
    );
  });

  it("maps the create link onto the New Playlist sheet", () => {
    for (const path of ["/create", "infinitunes://create/", "/create/"]) {
      expect(redirectSystemPath({ path })).toBe("/create-playlist");
    }
    expect(redirectSystemPath({ path: "/create-playlist" })).toBe(
      "/create-playlist",
    );
  });

  it("opens a label's albums link on the label screen, which is one page", () => {
    expect(
      redirectSystemPath({
        path: "infinitunes://label/t-series/pKJp_/albums?ref=share",
      }),
    ).toBe("/label/t-series/pKJp_?ref=share");
    expect(redirectSystemPath({ path: "/label/t-series/pKJp_/albums/" })).toBe(
      "/label/t-series/pKJp_",
    );
    // The label's songs route is already the screen's own path.
    expect(redirectSystemPath({ path: "/label/t-series/pKJp_" })).toBe(
      "/label/t-series/pKJp_",
    );
  });

  it("opens JioSaavn's featured playlist links on the playlist route", () => {
    expect(
      redirectSystemPath({ path: "infinitunes://featured/top-50/abc__?x=1" }),
    ).toBe("/playlist/top-50/abc__?x=1");
  });
});
