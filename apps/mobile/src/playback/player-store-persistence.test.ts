import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import Storage from "expo-sqlite/kv-store";

import { playerStore } from "./player-store";

const rows = ["a", "b", "c"].map((id) => toSongRow(rawSong({ id })));
const stored = () => {
  const json = Storage.getItemSync("player");
  return json ? (JSON.parse(json) as Record<string, unknown>) : null;
};

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

describe("player persistence", () => {
  it("keeps the queue and how it plays, but never that playback had started", async () => {
    const { playTracks, cycleRepeat, toggleShuffle } = playerStore.getState();
    playTracks(rows, { startIndex: 1 });
    cycleRepeat();
    toggleShuffle();
    await Promise.resolve();

    const saved = stored();
    expect(saved).toMatchObject({
      version: 1,
      state: { currentIndex: 1, repeat: "playlist", shuffle: true },
    });
    expect(Object.keys(saved?.state as object).toSorted()).toEqual([
      "currentIndex",
      "queue",
      "radio",
      "repeat",
      "shuffle",
    ]);
  });

  it("restores the queue on launch as not started, so nothing plays by itself", async () => {
    playerStore.getState().playTracks(rows, { startIndex: 2 });
    const saved = Storage.getItemSync("player");
    expect(saved).not.toBeNull();

    // A new launch: the in-memory state is gone, the kv-store row is not
    // (resetting the store here would persist the empty state over it).
    playerStore.setState(initial, true);
    expect(playerStore.getState().queue).toEqual([]);
    await Storage.setItemAsync("player", saved ?? "");
    await playerStore.persist.rehydrate();

    const state = playerStore.getState();
    expect(state.queue.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(state.currentIndex).toBe(2);
    expect(state.started).toBe(false);
    expect(state.resumeRequest).toBe(0);
  });
});
