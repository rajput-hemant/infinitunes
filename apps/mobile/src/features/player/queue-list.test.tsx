import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderScreen } from "~/test/render";

import { QueueList } from "./queue-list";

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
  it("shows what is playing, then only what comes next", async () => {
    await renderScreen(<QueueList />);

    expect(
      await screen.findByRole("header", { name: "Now playing" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("Bravo")).toBeOnTheScreen();
    expect(screen.getByText("Up next · 2")).toBeOnTheScreen();
    expect(screen.getByText("Charlie")).toBeOnTheScreen();
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("clears up next and keeps the current track", async () => {
    await renderScreen(<QueueList />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Clear up next" }),
    );

    expect(ids()).toEqual(["a", "b"]);
    expect(screen.getByText("Nothing else is queued.")).toBeOnTheScreen();
  });

  it("removes an entry from its menu with a toast", async () => {
    await renderScreen(<QueueList />);
    await screen.findByText("Delta");

    await chooseMenuAction("More actions for Delta", "remove");

    expect(ids()).toEqual(["a", "b", "c"]);
    expect(jest.mocked(toast)).toHaveBeenCalledWith("Removed from queue");
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
