import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";
import { getColors } from "react-native-image-colors";

import { pickDownloadFolder } from "~/lib/download";
import {
  cancelDownloads,
  downloadStore,
  finishSong,
  setSongProgress,
  startBatch,
  startSong,
} from "~/lib/download-store";
import { tap } from "~/lib/haptics";
import { renderScreen } from "~/test/render";
import { colors, translucentFill } from "~/theme/tokens";

import { findsNoSwatch } from "../../__mocks__/react-native-image-colors";
import { EntityHeader } from "./entity-header";

jest.mock("~/lib/haptics");
jest.mock("~/lib/download", () => ({
  pickDownloadFolder: jest.fn(),
  saveTracks: jest.fn(),
}));

const rows = [toSongRow(rawSong())];
const IMAGE = "https://c.saavncdn.com/a-500x500.jpg";

describe("EntityHeader", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(getColors).mockImplementation(findsNoSwatch);
    cancelDownloads();
    downloadStore.setState({ queued: {}, active: {}, batch: null });
  });

  it("turns Download into the run's overall ring, and a press cancels it", async () => {
    const many = ["a", "b", "c", "d"].map((id) => toSongRow(rawSong({ id })));
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        onPlay={jest.fn()}
        menu={{ rows: many }}
      />,
    );
    expect(screen.queryByRole("progressbar")).toBeNull();

    let signal!: AbortSignal;
    await act(async () => {
      signal = startBatch(["a", "b", "c", "d"], 4);
      startSong("a", signal);
      finishSong("a", "saved", signal);
      startSong("b", signal);
      setSongProgress("b", 0.5);
    });

    // 1 done + half of the second, of 4.
    const ring = screen.getByRole("progressbar", {
      name: "Downloading 2 of 4, double tap to cancel",
    });
    expect(ring).toHaveProp("accessibilityValue", {
      min: 0,
      max: 100,
      now: 38,
    });
    expect(screen.queryByRole("button", { name: "Download Album" })).toBeNull();

    await fireEvent.press(ring);

    expect(tap).toHaveBeenCalledTimes(1);
    expect(signal.aborted).toBe(true);
    expect(downloadStore.getState().batch).toBeNull();
    expect(
      screen.getByRole("button", { name: "Download Album" }),
    ).toBeOnTheScreen();
  });

  it("keeps Download for a header whose songs are not in the run", async () => {
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        onPlay={jest.fn()}
        menu={{ rows }}
      />,
    );

    await act(async () => void startBatch(["elsewhere"], 1));

    expect(
      screen.getByRole("button", { name: "Download Album" }),
    ).toBeOnTheScreen();
  });

  it("lays Shuffle, a content-hugging Play and Download in one centred row, signed out too", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const onPlay = jest.fn();
    const onShuffle = jest.fn();
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        onPlay={onPlay}
        onShuffle={onShuffle}
        like={{ type: "album", token: "a1" }}
        menu={{ rows }}
      />,
    );

    const play = screen.getByRole("button", { name: "Play" });
    const shuffle = screen.getByRole("button", { name: "Shuffle" });
    const download = screen.getByRole("button", { name: "Download Album" });
    // Row order: Shuffle, Play, Download.
    const buttons = screen.getAllByRole("button");
    expect(buttons.indexOf(shuffle)).toBeLessThan(buttons.indexOf(play));
    expect(buttons.indexOf(play)).toBeLessThan(buttons.indexOf(download));
    for (const button of [play, shuffle, download]) {
      expect(`${button.props.className}`).toContain("min-h-touch");
    }
    // Play hugs its content; the side buttons are translucent.
    expect(`${play.props.className}`).toContain("px-8");
    expect(shuffle).toHaveStyle({ backgroundColor: translucentFill.light });
    expect(download).toHaveStyle({ backgroundColor: translucentFill.light });
    // The heart left the row for the bar's menu.
    expect(screen.queryByRole("button", { name: "Like Album" })).toBeNull();

    await fireEvent.press(play);
    await fireEvent.press(shuffle);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onShuffle).toHaveBeenCalledTimes(1);
  });

  it("downloads every song from the Download button", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(null);
    await renderScreen(
      <EntityHeader
        image={IMAGE}
        title="Album"
        onPlay={jest.fn()}
        menu={{ rows }}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Download Album" }),
    );

    expect(pickDownloadFolder).toHaveBeenCalledTimes(1);
  });

  it("keeps the options out of the row: they live in the native header", async () => {
    await renderScreen(
      <EntityHeader image={IMAGE} title="Album" onPlay={jest.fn()} />,
    );

    expect(screen.queryByLabelText("More actions for Album")).toBeNull();
    expect(screen.queryByRole("button", { name: "Shuffle" })).toBeNull();
  });

  it("ends Android's wash on the page background the bar scrim fades in", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    jest.mocked(getColors).mockResolvedValue({
      platform: "ios",
      background: "#5B0F12",
      primary: "",
      secondary: "#F4E9E1",
      detail: "#000000",
      quality: "low",
    });
    await renderScreen(
      <EntityHeader image={IMAGE} title="Album" onPlay={jest.fn()} />,
    );

    const wash = await screen.findByTestId("header-wash");
    const gradient = String(
      StyleSheet.flatten(wash.props.style).backgroundImage,
    );
    expect(gradient.endsWith(`, ${colors.light.background} 100%)`)).toBe(true);
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
