import { act, fireEvent, screen } from "@testing-library/react-native";
import { router, Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import { Pressable, Text } from "react-native";

import { useOpenEntity } from "./use-open-entity";

const ARTIST_URL =
  "https://www.jiosaavn.com/artist/flipperachi-songs/LnMfdXjMGl0_";
const ALBUM_PATH = "/album/udta-teer/LHgqn,SRpyA_";

function OpenArtist() {
  const openEntity = useOpenEntity();
  return (
    <Pressable onPress={() => openEntity("artist", ARTIST_URL)}>
      <Text>Go to Artist</Text>
    </Pressable>
  );
}

describe("app routes", () => {
  it("opens a detail screen inside the tab it was opened from", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/search" });
    expect(app.getSegments()).toEqual(["(tabs)", "(search)", "search"]);

    await act(async () => router.push(ALBUM_PATH));

    expect(app.getPathname()).toBe(ALBUM_PATH);
    expect(app.getSegments()).toEqual([
      "(tabs)",
      "(search)",
      "album",
      "[name]",
      "[token]",
    ]);
    await act(async () => router.back());
    expect(app.getPathname()).toBe("/search");
  });

  it.each([
    ["an album", ALBUM_PATH, ["album", "[name]", "[token]"]],
    [
      "a show at a season",
      "/show/the-ranveer-show/2/mXtDJ4Yd2Sw_",
      ["show", "[name]", "[season]", "[token]"],
    ],
    [
      "an artist tab",
      "/artist/flipperachi/LnMfdXjMGl0_/songs",
      ["artist", "[name]", "[token]", "[tab]"],
    ],
    ["the top albums list", "/album", ["album"]],
    ["the charts", "/chart", ["chart"]],
  ])("opens %s at the web's path", async (_, initialUrl, segments) => {
    const app = await renderRouter("./src/app", { initialUrl });

    expect(app.getPathname()).toBe(initialUrl);
    expect(app.getSegments()).toEqual(["(tabs)", "(home)", ...segments]);
  });

  it("keeps the library and settings tabs at their old URLs", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/library" });
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "library"]);

    await act(async () => router.navigate("/settings"));
    expect(app.getSegments()).toEqual(["(tabs)", "(settings)", "settings"]);
  });
});

describe("useOpenEntity", () => {
  const tree = {
    _layout: () => <Stack />,
    "(tabs)/_layout": () => <Stack />,
    "(tabs)/index": () => null,
    "(tabs)/album/[name]/[token]": OpenArtist,
    "(tabs)/artist/[name]/[token]/[tab]": () => null,
    player: OpenArtist,
  };

  it("pushes onto the tab, keeping the screen it came from", async () => {
    const app = await renderRouter(tree, { initialUrl: "/" });
    await act(async () => router.push(ALBUM_PATH));

    await fireEvent.press(screen.getByText("Go to Artist"));
    expect(app.getPathname()).toBe("/artist/flipperachi/LnMfdXjMGl0_/songs");

    await act(async () => router.back());
    expect(app.getPathname()).toBe(ALBUM_PATH);
  });

  it("closes the player first, opening the screen in the tab below", async () => {
    const app = await renderRouter(tree, { initialUrl: "/" });
    await act(async () => router.push("/player"));

    await fireEvent.press(screen.getByText("Go to Artist"));
    expect(app.getPathname()).toBe("/artist/flipperachi/LnMfdXjMGl0_/songs");

    await act(async () => router.back());
    expect(app.getPathname()).toBe("/");
  });
});
