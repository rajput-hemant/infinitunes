import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen, within } from "@testing-library/react-native";

import { playerColorsFromSeed } from "~/lib/artwork-colors";
import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";

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

  it("removes an entry from its long-press menu", async () => {
    await renderScreen(<QueueList />);
    const delta = await screen.findByRole("button", { name: "Delta" });

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

  it("paints the whole row, handle included, as an opaque card while a touch rests", async () => {
    jest.useFakeTimers();
    try {
      await renderScreen(<QueueList />);
      const [row] = await screen.findAllByTestId("queue-row");
      if (!row) throw new Error("no queue row");
      expect(row.props.style).toBeUndefined();
      // The drag handle is the row's own child, so the lifted region includes it.
      expect(
        within(row).getByRole("button", { name: /^Reorder / }),
      ).toBeOnTheScreen();

      await fireEvent(row, "touchStart");
      await act(async () => {
        jest.advanceTimersByTime(300);
      });
      expect(screen.getAllByTestId("queue-row")[0]?.props.style).toMatchObject({
        backgroundColor: expect.any(String),
        borderRadius: expect.any(Number),
      });

      await fireEvent(row, "touchEnd");
      expect(
        screen.getAllByTestId("queue-row")[0]?.props.style,
      ).toBeUndefined();
    } finally {
      jest.useRealTimers();
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
