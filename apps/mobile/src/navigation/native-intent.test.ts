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
      "/search",
    ]) {
      expect(redirectSystemPath({ path })).toBe(path);
    }
  });
});
