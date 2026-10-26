import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { playerColorsFromSeed } from "~/lib/artwork-colors";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { reorderState } from "~/test/reorderable-list";

import { QueueList } from "./queue-list";
import { nowPlayingWash, OnWash } from "./wash";

const rows = [
  rawSong({ id: "a", title: "Alpha" }),
  rawSong({ id: "b", title: "Bravo" }),
  rawSong({ id: "c", title: "Charlie" }),
  rawSong({ id: "d", title: "Delta" }),
].map(toSongRow);
const ids = () => playerStore.getState().queue.map((entry) => entry.id);
const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  playerStore.getState().playTracks(rows, { startIndex: 1 });
});

afterEach(() => jest.restoreAllMocks());

describe("QueueList", () => {
  it("shows only what comes next (the player's header shows what plays)", async () => {
    await renderScreen(<QueueList />);

    expect(
      await screen.findByRole("header", { name: "Up next · 2" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Charlie")).toBeOnTheScreen();
    expect(screen.getByText("Delta")).toBeOnTheScreen();
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.queryByText("Bravo")).toBeNull();
  });

  it("clears up next and keeps the current track", async () => {
    await renderScreen(<QueueList />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Clear up next" }),
    );

    expect(ids()).toEqual(["a", "b"]);
    expect(screen.getByText("Nothing else is queued.")).toBeOnTheScreen();
  });

  it("removes an entry from its long-press context menu (iOS: the system menu, one per row)", async () => {
    await renderScreen(<QueueList />);
    await screen.findByRole("button", { name: "Delta" });

    const menu = screen.getByTestId("queue-row-menu-d");
    await fireEvent(menu, "pressAction", { nativeEvent: { event: "remove" } });

    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("gives every iOS row the list's full width, so the menu host cannot hug its text", async () => {
    await renderScreen(<QueueList />);
    await screen.findByRole("button", { name: "Delta" });

    await fireEvent(screen.getAllByTestId("queue-row-frame")[0]!, "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 342, height: 56 } },
    });

    expect(screen.getAllByTestId("queue-row-body")[0]).toHaveStyle({
      width: 342,
    });
  });

  it("opens the dropdown on a long press on Android, mounting it then", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(<QueueList />);
    const delta = await screen.findByRole("button", { name: "Delta" });
    expect(screen.queryByTestId("queue-row-menu")).toBeNull();

    await fireEvent(delta, "longPress");
    await fireEvent(screen.getByTestId("queue-row-menu"), "pressAction", {
      nativeEvent: { event: "remove" },
    });

    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("shows only the drag handle at a row's end, its menu on a long press", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("Delta");

    expect(
      screen.queryByRole("button", { name: "More actions for Delta" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /^Like / })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Reorder Delta" }),
    ).toBeOnTheScreen();
  });

  it("offers the menu's entries as the row's screen reader actions", async () => {
    await renderScreen(<QueueList />);
    const delta = await screen.findByRole("button", { name: "Delta" });

    expect(
      delta.props.accessibilityActions.map(
        (action: { label: string }) => action.label,
      ),
    ).toEqual([
      "Favourite",
      "Share",
      "Play Next",
      "Create Station",
      "Go to Artist: Hussam Assim",
      "Go to Artist: Flipperachi",
      "View Credits",
      "Remove from Queue",
    ]);
    await fireEvent(delta, "accessibilityAction", {
      nativeEvent: { actionName: "play-next" },
    });
    expect(ids()).toEqual(["a", "b", "d", "c", "d"]);
  });

  it("highlights the whole row while pressed, the drag handle inside it", async () => {
    await renderScreen(<QueueList />);
    const delta = await screen.findByRole("button", { name: "Delta" });
    const handle = screen.getByRole("button", { name: "Reorder Delta" });

    await fireEvent(delta, "pressIn");

    let node = handle.parent;
    let highlighted = false;
    while (node && !highlighted) {
      highlighted = String(node.props.className ?? "").includes("bg-fill-2");
      node = node.parent;
    }
    expect(highlighted).toBe(true);
  });

  it("removes a row from its revealed Remove button once the row has slid out (a slow swipe that rests open)", async () => {
    jest.useFakeTimers();
    await renderScreen(<QueueList />);
    await screen.findByText("Delta");

    const [first] = screen.getAllByRole("button", { name: "Remove" });
    if (!first) throw new Error("no Remove button");
    await fireEvent.press(first);
    // Still queued while the exit animation runs.
    expect(ids()).toEqual(["a", "b", "c", "d"]);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(ids()).toEqual(["a", "b", "d"]);
    jest.useRealTimers();
  });

  it("disables the swipe while a row's handle drags it", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("Delta");
    expect(
      screen.getAllByTestId("swipeable")[0]?.props.accessibilityState,
    ).toEqual({ disabled: false });

    reorderState.active = true;
    try {
      await renderScreen(<QueueList />);
      expect(
        screen.getAllByTestId("swipeable")[0]?.props.accessibilityState,
      ).toEqual({ disabled: true });
    } finally {
      reorderState.active = false;
    }
  });

  it("reorders up next by dragging", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("Delta");

    await fireEvent(screen.getByTestId("reorderable-list"), "reorder", {
      from: 1,
      to: 0,
    });

    expect(ids()).toEqual(["a", "b", "d", "c"]);
    expect(playerStore.getState().currentIndex).toBe(1);
  });

  it("jumps to an entry when pressed", async () => {
    await renderScreen(<QueueList />);

    await fireEvent.press(await screen.findByRole("button", { name: "Delta" }));

    expect(playerStore.getState().currentIndex).toBe(3);
  });
});

describe("QueueList on the artwork wash", () => {
  it("draws its rows and labels in the wash's checked colours", async () => {
    const colors = playerColorsFromSeed("#5B0F12", "dark", "ios");
    if (!colors) throw new Error("the test seed must pass");
    const wash = nowPlayingWash(colors);
    await renderScreen(
      <OnWash colors={wash}>
        <QueueList />
      </OnWash>,
    );

    expect(await screen.findByText("Charlie")).toHaveStyle({
      color: wash.foreground,
    });
    expect(screen.getAllByText("Flipperachi - FA9LA")[0]).toHaveStyle({
      color: wash.muted,
    });
    expect(screen.getByText("Up next · 2")).toHaveStyle({
      color: wash.muted,
    });
  });
});
