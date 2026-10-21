import { Platform } from "react-native";

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

  it("opens a search link in the iOS search tab, keeping its query", () => {
    expect(redirectSystemPath({ path: "infinitunes://search?q=arijit" })).toBe(
      "/(tabs)/(search)/search?q=arijit",
    );
    expect(redirectSystemPath({ path: "/search" })).toBe(
      "/(tabs)/(search)/search",
    );
  });

  it("opens a search link in Home's stack on Android, which has no search tab", () => {
    jest.replaceProperty(Platform, "OS", "android");

    try {
      expect(
        redirectSystemPath({ path: "infinitunes://search?q=a%20r%20rahman" }),
      ).toBe("/(tabs)/(home)/search?q=a%20r%20rahman");
    } finally {
      jest.restoreAllMocks();
    }
  });
});
