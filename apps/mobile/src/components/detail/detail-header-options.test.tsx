import { fireEvent, screen } from "@testing-library/react-native";
import { Platform, Share } from "react-native";

import { renderWithProviders } from "~/test/render";

import { detailHeaderOptions } from "./detail-header-options";

function renderHeaderRight(options: ReturnType<typeof detailHeaderOptions>) {
  return renderWithProviders(<>{options.headerRight?.({ canGoBack: true })}</>);
}

describe("detailHeaderOptions", () => {
  it("titles the bar with the item and shares its web page", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({
      action: "dismissedAction",
      activityType: undefined,
    });
    const options = detailHeaderOptions({
      name: "Flipperachi",
      type: "artist",
      url: "https://www.jiosaavn.com/artist/flipperachi/LnMfdXjMGl0_",
    });
    expect(options.title).toBe("Flipperachi");
    expect(options.headerLargeTitle).toBe(false);
    await renderHeaderRight(options);

    await fireEvent.press(
      screen.getByRole("button", { name: "Share Flipperachi" }),
    );

    expect(share).toHaveBeenCalledWith({
      title: "Flipperachi",
      message:
        "Flipperachi https://infinitunes.test/artist/flipperachi/LnMfdXjMGl0_",
      url: "https://infinitunes.test/artist/flipperachi/LnMfdXjMGl0_",
    });
  });

  describe("scrolled under the bar", () => {
    const item = {
      name: "Udta Teer",
      type: "album",
      url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
    } as const;
    afterEach(() => jest.restoreAllMocks());

    it("tints and titles Android's bar, and resets both at the top", () => {
      jest.replaceProperty(Platform, "OS", "android");

      const scrolled = detailHeaderOptions(item, "#e0e0e0");
      expect(scrolled.headerTitle).toBe("Udta Teer");
      expect(scrolled.headerStyle).toEqual({ backgroundColor: "#e0e0e0" });

      // Options merge: the reset keys must be present, not left out.
      const top = detailHeaderOptions(item);
      expect(top).toHaveProperty("headerStyle", undefined);
      expect(top.headerTitle).toBe("");
    });

    it("titles iOS's bar once scrolled, without a tint", () => {
      jest.replaceProperty(Platform, "OS", "ios");

      const scrolled = detailHeaderOptions(item, "#e0e0e0");
      expect(scrolled.headerTitle).toBe("Udta Teer");
      expect(detailHeaderOptions(item).headerTitle).toBe("");
      expect(scrolled).not.toHaveProperty("headerStyle");
    });
  });

  it("leaves the bar empty before the item is known", () => {
    const options = detailHeaderOptions();

    expect(options.title).toBe("");
    expect(options.headerRight).toBeUndefined();
  });
});
