import { fireEvent, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderScreen } from "~/test/render";

import { QuickPickTile } from "./quick-pick-tile";

describe("QuickPickTile", () => {
  it("opens its item and has no Play button", async () => {
    const app = await renderScreen(
      <QuickPickTile
        width={170}
        title="Udta Teer"
        href="/album/udta-teer/abc"
        leading={{ artwork: "https://c.saavncdn.com/a-150x150.jpg" }}
        item={{
          id: "abc",
          name: "Udta Teer",
          image: "https://c.saavncdn.com/a-500x500.jpg",
          type: "album",
          url: "https://www.jiosaavn.com/album/x/abc",
        }}
      />,
      { routes: { "album/[name]/[token]": () => null } },
    );

    expect(screen.queryByRole("button", { name: /^Play/ })).toBeNull();
    await fireEvent.press(screen.getByRole("link", { name: "Udta Teer" }));

    expect(app.getPathname()).toBe("/album/udta-teer/abc");
  });

  it("is an action button with an icon in place of the art", async () => {
    const onPress = jest.fn();
    await renderScreen(
      <QuickPickTile
        width={170}
        title="Surprise me"
        onPress={onPress}
        leading={{ icon: { ios: "sparkles", android: "auto_awesome" } }}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Surprise me" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("ripples within its corners on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(
      <QuickPickTile
        width={170}
        title="Surprise me"
        onPress={jest.fn()}
        leading={{ icon: { ios: "sparkles", android: "auto_awesome" } }}
      />,
    );

    const tile = screen.getByRole("button", { name: "Surprise me" });
    expect(tile.props.nativeForegroundAndroid).toMatchObject({
      type: "RippleAndroid",
      borderless: false,
    });
    expect(tile).toHaveProp(
      "className",
      expect.stringContaining("overflow-hidden rounded-md"),
    );
  });

  it("tints the icon's cell with a fill over the tile, not a second surface", async () => {
    await renderScreen(
      <QuickPickTile
        width={170}
        title="Surprise me"
        onPress={jest.fn()}
        leading={{ icon: { ios: "sparkles", android: "auto_awesome" } }}
      />,
    );

    expect(screen.getByTestId("pick-icon-cell")).toHaveProp(
      "className",
      expect.stringContaining("bg-fill-2"),
    );
  });
});
