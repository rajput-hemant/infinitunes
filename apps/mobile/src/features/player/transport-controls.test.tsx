import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { impactAsync } from "expo-haptics";
import { Platform } from "react-native";

import { nowPlayingWash, OnWash } from "~/components/wash";
import {
  contrastRatio,
  MIN_CONTROL_CONTRAST,
  MIN_TEXT_CONTRAST,
  playerColorsFromSeed,
} from "~/lib/artwork-colors";
import { audioPlayer, replaceSource } from "~/playback/audio-engine";
import {
  playbackStatusStore,
  requestPlaying,
} from "~/playback/playback-status";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { radii, sizes } from "~/theme/tokens";

import { PlayPauseButton, TransportControls } from "./transport-controls";

const rows = ["a", "b", "c"].map((id) => toSongRow(rawSong({ id })));
const current = () => playerStore.getState().currentIndex;

const initialPlayer = playerStore.getState();
const initialStatus = playbackStatusStore.getState();

beforeEach(() => {
  requestPlaying(null);
  playerStore.setState(initialPlayer, true);
  playbackStatusStore.setState(initialStatus, true);
  audioPlayer.pause();
  replaceSource("https://example.test/a.mp4");
  playerStore.getState().playTracks(rows, { startIndex: 1 });
});

afterEach(() => requestPlaying(null));

const press = (name: string) =>
  fireEvent.press(screen.getByRole("button", { name }));

describe("PlayPauseButton", () => {
  it("offers Play while paused and starts the engine", async () => {
    await renderScreen(<PlayPauseButton />);
    const play = jest.spyOn(audioPlayer, "play");

    await press("Play");

    expect(play).toHaveBeenCalledTimes(1);
  });

  it("flips both iOS play controls before native status and accepts a second press", async () => {
    const play = jest.spyOn(audioPlayer, "play").mockImplementation(() => {});
    const pause = jest.spyOn(audioPlayer, "pause").mockImplementation(() => {});
    await renderScreen(
      <>
        <PlayPauseButton />
        <TransportControls />
      </>,
    );

    await fireEvent.press(screen.getAllByRole("button", { name: "Play" })[0]);
    expect(screen.getAllByRole("button", { name: "Pause" })).toHaveLength(2);
    expect(playbackStatusStore.getState().playing).toBe(false);

    await fireEvent.press(screen.getAllByRole("button", { name: "Pause" })[1]);
    expect(screen.getAllByRole("button", { name: "Play" })).toHaveLength(2);
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalledTimes(1);
    play.mockRestore();
    pause.mockRestore();
  });

  it("offers Pause while playing, and follows the engine", async () => {
    await renderScreen(<PlayPauseButton />);
    expect(screen.getByRole("button", { name: "Play" })).toBeOnTheScreen();

    await act(async () => playbackStatusStore.setState({ playing: true }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeOnTheScreen();

    audioPlayer.play();
    const pause = jest.spyOn(audioPlayer, "pause");
    await press("Pause");
    expect(pause).toHaveBeenCalledTimes(1);
  });
});

describe("PlayPauseButton on Android", () => {
  afterEach(() => jest.restoreAllMocks());

  it("morphs the dock's 40dp shape: a circle playing, a rounded square paused", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(<PlayPauseButton />);
    expect(screen.getByTestId("play-pause-shape")).toHaveStyle({
      width: sizes.ctl,
      borderRadius: radii.sm,
    });
  });

  it("starts as a circle while playing", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    playbackStatusStore.setState({ playing: true });
    await renderScreen(<PlayPauseButton />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeOnTheScreen();
    expect(screen.getByTestId("play-pause-shape")).toHaveStyle({
      borderRadius: sizes.ctl / 2,
    });
  });
});

describe("TransportControls", () => {
  it("moves to the next and previous track", async () => {
    await renderScreen(<TransportControls />);

    await press("Next track");
    expect(current()).toBe(2);

    await press("Previous track");
    await press("Previous track");
    expect(current()).toBe(0);
  });

  it("toggles shuffle and shows it selected", async () => {
    await renderScreen(<TransportControls />);
    expect(screen.getByRole("button", { name: "Shuffle" })).not.toBeSelected();

    await press("Shuffle");

    expect(playerStore.getState().shuffle).toBe(true);
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeSelected();

    await press("Shuffle");
    expect(playerStore.getState().shuffle).toBe(false);
    expect(screen.getByRole("button", { name: "Shuffle" })).not.toBeSelected();
  });

  it("marks a mode that is on with a filled circle, not only a colour", async () => {
    await renderScreen(<TransportControls />);
    expect(screen.queryAllByTestId("mode-toggle-on")).toHaveLength(0);

    await press("Shuffle");
    await press("Repeat off");

    // Shuffle and Repeat all: iOS draws the same symbol either way.
    expect(screen.getAllByTestId("mode-toggle-on")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeSelected();
    expect(screen.getByRole("button", { name: "Repeat all" })).toBeSelected();
  });

  it("keeps the circle a native view while off, so turning on keeps its corners", async () => {
    await renderScreen(<TransportControls />);
    // A flattened view is created on "on" with only the changed props on
    // Android, and the circle drew square.
    for (const circle of screen.getAllByTestId("mode-toggle-off")) {
      expect(circle.props.collapsable).toBe(false);
    }
    await press("Shuffle");
    expect(screen.getByTestId("mode-toggle-on").props.collapsable).toBe(false);
  });

  it("draws the circle in the wash's checked play-shape colours", async () => {
    const colors = playerColorsFromSeed("#5B0F12", "light", "ios");
    if (!colors) throw new Error("the test seed must pass");
    const wash = nowPlayingWash(colors);
    await renderScreen(
      <OnWash colors={wash}>
        <TransportControls />
      </OnWash>,
    );

    await press("Shuffle");

    expect(screen.getByTestId("mode-toggle-on")).toHaveStyle({
      backgroundColor: wash.control,
    });
    expect(contrastRatio(wash.onControl, wash.control)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST,
    );
    for (const stop of colors.wash) {
      expect(contrastRatio(wash.control, stop)).toBeGreaterThanOrEqual(
        MIN_CONTROL_CONTRAST,
      );
    }
  });

  it("cycles repeat through the playlist and the track, saying which", async () => {
    await renderScreen(<TransportControls />);
    expect(
      screen.getByRole("button", { name: "Repeat off" }),
    ).not.toBeSelected();

    await press("Repeat off");
    expect(screen.getByRole("button", { name: "Repeat all" })).toBeSelected();

    await press("Repeat all");
    expect(screen.getByRole("button", { name: "Repeat one" })).toBeSelected();

    await press("Repeat one");
    expect(
      screen.getByRole("button", { name: "Repeat off" }),
    ).not.toBeSelected();
    expect(playerStore.getState().repeat).toBe("off");
  });
});

describe("transport haptics", () => {
  beforeEach(() => jest.mocked(impactAsync).mockClear());

  it("taps once for an icon button face (it taps on its own)", async () => {
    await renderScreen(<TransportControls />);
    await press("Next track");
    expect(impactAsync).toHaveBeenCalledTimes(1);
  });

  it("taps once for a pressable face", async () => {
    await renderScreen(<TransportControls />);
    await press("Play");
    expect(impactAsync).toHaveBeenCalledTimes(1);
  });
});
