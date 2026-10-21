import { stationHref, stationRef } from "~/navigation/station-ref";

describe("stationRef", () => {
  it("reads the name and token from a station's perma URL", () => {
    const url =
      "https://www.saavn.com/s/radio/hindi-featured-station/Chill-Karo?x=1";

    const ref = stationRef(url);

    expect(ref).toEqual({
      name: "hindi-featured-station",
      token: "Chill-Karo",
    });
    expect(ref && stationHref(ref)).toEqual({
      pathname: "/radio/[name]/[token]",
      params: { name: "hindi-featured-station", token: "Chill-Karo" },
    });
  });

  it("has no station for a URL without a name and a token", () => {
    expect(stationRef("https://www.saavn.com/Chill-Karo")).toBeUndefined();
    expect(stationRef("")).toBeUndefined();
  });
});
