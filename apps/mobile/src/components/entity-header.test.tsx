import { fireEvent, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderScreen } from "~/test/render";
import { signInAs } from "~/test/session-mock";

import { EntityHeader } from "./entity-header";

const IMAGE = "https://c.saavncdn.com/a-500x500.jpg";

describe("EntityHeader", () => {
  afterEach(() => jest.restoreAllMocks());

  it("lays Shuffle, a wide labelled Play and the heart in one row, each a 48pt target on iOS", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    signInAs("user-1");
    const onPlay = jest.fn();
    const onShuffle = jest.fn();
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        onPlay={onPlay}
        onShuffle={onShuffle}
        like={{ type: "album", token: "a1" }}
      />,
    );

    const play = screen.getByRole("button", { name: "Play" });
    const shuffle = screen.getByRole("button", { name: "Shuffle" });
    const like = screen.getByRole("button", { name: "Like Album" });
    expect(`${play.props.className}`).toContain("min-h-touch");
    expect(`${shuffle.props.className}`).toContain("min-h-touch");
    expect(`${like.props.className}`).toContain("min-h-touch");
    // Shuffle and the heart are the same round tonal button.
    expect(`${shuffle.props.className}`).toContain("bg-secondary");
    expect(`${like.props.className}`).toContain("bg-secondary");
    expect(screen.getByText("Play")).toBeOnTheScreen();

    await fireEvent.press(play);
    await fireEvent.press(shuffle);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onShuffle).toHaveBeenCalledTimes(1);
  });

  it("keeps the options out of the row: they live in the native header", async () => {
    await renderScreen(
      <EntityHeader image={IMAGE} title="Album" onPlay={jest.fn()} />,
    );

    expect(screen.queryByLabelText("More actions for Album")).toBeNull();
    expect(screen.queryByRole("button", { name: "Shuffle" })).toBeNull();
  });

  it("wraps a long title instead of cutting it", async () => {
    const title = "A very long album title that needs more than one line";
    await renderScreen(
      <EntityHeader image={IMAGE} title={title} onPlay={jest.fn()} />,
    );

    expect(screen.getByText(title).props.numberOfLines).toBeUndefined();
  });

  it("makes the credit a link to the artist when it has a target", async () => {
    const open = jest.fn();
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        subtitle="Arijit Singh"
        onSubtitlePress={open}
        onPlay={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("link", { name: "Arijit Singh" }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("shows a plain credit without a target", async () => {
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        subtitle="Various Artists"
        onPlay={jest.fn()}
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Various Artists")).toBeOnTheScreen();
  });
});
