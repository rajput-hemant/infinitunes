import { screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderScreen } from "~/test/render";
import { sizes } from "~/theme/tokens";

import { EntityHeader } from "./entity-header";

async function renderHeader() {
  await renderScreen(
    <EntityHeader
      image="https://c.saavncdn.com/a-500x500.jpg"
      title="Album"
      onPlay={jest.fn()}
      onShuffle={jest.fn()}
    />,
  );
  return {
    play: `${screen.getByRole("button", { name: "Play" }).props.className}`,
    shuffle: `${screen.getByRole("button", { name: "Shuffle" }).props.className}`,
  };
}

describe("EntityHeader", () => {
  afterEach(() => jest.restoreAllMocks());

  it("keeps Play and Shuffle the same size on iOS", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { play, shuffle } = await renderHeader();

    expect(play).not.toContain("size-row");
    expect(play).toContain("min-h-touch");
    expect(shuffle).toContain("min-h-touch");
  });

  it("makes Play the large button on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderHeader();

    expect(screen.getByRole("button", { name: "Play" })).toHaveStyle({
      width: sizes.row,
    });
    expect(screen.getByRole("button", { name: "Shuffle" })).toHaveStyle({
      width: sizes.ctl,
    });
  });
});
