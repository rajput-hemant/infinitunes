import type { SearchItem } from "@infinitunes/types";
import { Platform } from "react-native";

import { resultSubtitle } from "./result-subtitle";

const item = (fields: Partial<SearchItem>): SearchItem => ({
  id: "1",
  title: "Gehra Hua",
  type: "song",
  image: "",
  ...fields,
});

describe("resultSubtitle", () => {
  it("keeps upstream's raw line on iOS", () => {
    expect(resultSubtitle(item({ subtitle: "Dhurandhar" }))).toBe("Dhurandhar");
  });

  describe("on Android", () => {
    beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));

    it("names the kind and the singers instead of the album", () => {
      const song = item({
        subtitle: "Gehra Hua",
        more_info: { singers: "Arijit Singh", primary_artists: "Shashwat" },
      });
      expect(resultSubtitle(song)).toBe("Song · Arijit Singh");
    });

    it("gives an artist its own role", () => {
      expect(
        resultSubtitle(item({ type: "artist", description: "Singer" })),
      ).toBe("Singer");
    });

    it("gives only the kind without a credit", () => {
      expect(resultSubtitle(item({ type: "show" }))).toBe("Podcast");
    });
  });
});
