import { act, fireEvent, screen } from "@testing-library/react-native";
import { router, Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import { Pressable, Text } from "react-native";

import { useOpenEntity } from "./use-open-entity";

jest.mock("~/lib/trpc", () => require("~/test/trpc-mock"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
// Native tabs render every tab; the Home feed's data is not under test here.
jest.mock("~/features/home/trending-list", () => ({
  TrendingList: () => null,
}));

const ARTIST_URL =
  "https://www.jiosaavn.com/artist/flipperachi-songs/LnMfdXjMGl0_";

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

    await act(async () => router.push("/album/LHgqn,SRpyA_"));

    expect(app.getPathname()).toBe("/album/LHgqn,SRpyA_");
    expect(app.getSegments()).toEqual([
      "(tabs)",
      "(search)",
      "album",
      "[token]",
    ]);
    await act(async () => router.back());
    expect(app.getPathname()).toBe("/search");
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
    "(tabs)/album/[token]": OpenArtist,
    "(tabs)/artist/[token]": () => null,
    player: OpenArtist,
  };

  it("pushes onto the tab, keeping the screen it came from", async () => {
    const app = await renderRouter(tree, { initialUrl: "/" });
    await act(async () => router.push("/album/LHgqn,SRpyA_"));

    await fireEvent.press(screen.getByText("Go to Artist"));
    expect(app.getPathname()).toBe("/artist/LnMfdXjMGl0_");

    await act(async () => router.back());
    expect(app.getPathname()).toBe("/album/LHgqn,SRpyA_");
  });

  it("closes the player first, opening the screen in the tab below", async () => {
    const app = await renderRouter(tree, { initialUrl: "/" });
    await act(async () => router.push("/player"));

    await fireEvent.press(screen.getByText("Go to Artist"));
    expect(app.getPathname()).toBe("/artist/LnMfdXjMGl0_");

    await act(async () => router.back());
    expect(app.getPathname()).toBe("/");
  });
});
