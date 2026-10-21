import { rawArtist } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";
import { Share } from "react-native";

import { renderWithProviders } from "~/test/render";

import { artistShareUrl } from "./artist-share-url";
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
      url: artistShareUrl(rawArtist()),
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

  it("leaves the bar empty before the item is known", () => {
    const options = detailHeaderOptions();

    expect(options.title).toBe("");
    expect(options.headerRight).toBeUndefined();
  });
});
