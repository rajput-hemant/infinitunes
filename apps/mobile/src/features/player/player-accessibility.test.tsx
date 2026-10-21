import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";

import {
  playbackPosition,
  playbackStatusStore,
} from "~/playback/playback-status";
import { playerStore } from "~/playback/player-store";
import { seekTo } from "~/playback/transport";
import { renderScreen } from "~/test/render";

import { FullPlayer } from "./full-player";
import { QueueList } from "./queue-list";
import { Scrubber } from "./scrubber";
import { TransportControls } from "./transport-controls";

jest.mock("~/playback/transport", () => ({
  ...jest.requireActual("~/playback/transport"),
  seekTo: jest.fn(),
}));

const initial = playerStore.getState();
const rows = ["a", "b", "c", "d"].map((id) =>
  toSongRow(rawSong({ id, title: id.toUpperCase() })),
);
const queued = () => playerStore.getState().queue.map((entry) => entry.id);

beforeEach(() => {
  jest.mocked(seekTo).mockClear();
  playerStore.setState(initial, true);
  playbackPosition.set(30);
  playbackStatusStore.setState({ duration: 200 });
});

const adjust = (actionName: "increment" | "decrement") =>
  fireEvent(
    screen.getByRole("adjustable", { name: "Playback position" }),
    "accessibilityAction",
    { nativeEvent: { actionName } },
  );

const moveEntry = (name: string, actionName: "moveUp" | "moveDown") =>
  fireEvent(
    screen.getByRole("button", { name: `Reorder ${name}` }),
    "accessibilityAction",
    { nativeEvent: { actionName } },
  );

describe("Scrubber", () => {
  it("reads the position and the length", async () => {
    await renderScreen(<Scrubber />);

    expect(
      screen.getByRole("adjustable", { name: "Playback position" }),
    ).toHaveAccessibilityValue({ text: "00:30 of 03:20" });
  });

  it("seeks ten seconds on a swipe up or down", async () => {
    await renderScreen(<Scrubber />);

    await adjust("increment");
    expect(seekTo).toHaveBeenLastCalledWith(40);

    await adjust("decrement");
    expect(seekTo).toHaveBeenLastCalledWith(20);
  });

  it("stays inside the track", async () => {
    await renderScreen(<Scrubber />);

    await act(async () => playbackPosition.set(195));
    await adjust("increment");
    expect(seekTo).toHaveBeenLastCalledWith(200);

    await act(async () => playbackPosition.set(4));
    await adjust("decrement");
    expect(seekTo).toHaveBeenLastCalledWith(0);
  });
});

describe("FullPlayer", () => {
  it("has a labelled control to close it", async () => {
    playerStore.getState().playTracks(rows);
    await renderScreen(<FullPlayer />);

    expect(
      await screen.findByRole("button", { name: "Close player" }),
    ).toBeOnTheScreen();
  });

  it("can be closed while nothing plays", async () => {
    await renderScreen(<FullPlayer />);

    expect(
      await screen.findByRole("button", { name: "Close player" }),
    ).toBeOnTheScreen();
  });
});

describe("TransportControls", () => {
  it("says what repeat does in plain words and keeps its state", async () => {
    playerStore.getState().playTracks(rows);
    await renderScreen(<TransportControls />);

    const repeat = screen.getByRole("button", { name: "Repeat off" });
    expect(repeat).not.toBeSelected();

    await fireEvent.press(repeat);
    expect(screen.getByRole("button", { name: "Repeat all" })).toBeSelected();

    await fireEvent.press(screen.getByRole("button", { name: "Repeat all" }));
    expect(screen.getByRole("button", { name: "Repeat one" })).toBeSelected();
  });
});

describe("QueueList reordering", () => {
  beforeEach(() => {
    playerStore.getState().playTracks(rows, { startIndex: 0 });
  });

  it("moves an entry without dragging it", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("D");

    await moveEntry("D", "moveUp");
    expect(queued()).toEqual(["a", "b", "d", "c"]);

    await moveEntry("B", "moveDown");
    expect(queued()).toEqual(["a", "d", "b", "c"]);
  });

  it("offers only the directions an entry can go", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("D");

    expect(screen.getByRole("button", { name: "Reorder B" })).toHaveProp(
      "accessibilityActions",
      [{ name: "moveDown", label: "Move down" }],
    );
    expect(screen.getByRole("button", { name: "Reorder D" })).toHaveProp(
      "accessibilityActions",
      [{ name: "moveUp", label: "Move up" }],
    );
  });
});
