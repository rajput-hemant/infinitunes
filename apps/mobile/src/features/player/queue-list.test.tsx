import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { playerColorsFromSeed } from "~/lib/artwork-colors";
import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderScreen } from "~/test/render";

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

  it("removes an entry from its menu", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("Delta");

    await chooseMenuAction("More actions for Delta", "remove");

    expect(ids()).toEqual(["a", "b", "c"]);
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
