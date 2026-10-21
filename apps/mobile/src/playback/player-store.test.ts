import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";

import { playerStore, selectCurrentTrack } from "./player-store";

const rows = ["a", "b", "c"].map((id) => toSongRow(rawSong({ id })));
const ids = () => playerStore.getState().queue.map((entry) => entry.id);
const current = () => selectCurrentTrack(playerStore.getState())?.id;

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

describe("player store", () => {
  it("queues a list and starts at the pressed row", () => {
    playerStore.getState().playTracks(rows, { startIndex: 1 });

    expect(ids()).toEqual(["a", "b", "c"]);
    expect(current()).toBe("b");
    expect(playerStore.getState().started).toBe(true);
  });

  it("only moves the position when the same list is played again", () => {
    const { playTracks } = playerStore.getState();
    playTracks(rows);
    const entries = playerStore.getState().queue;

    playTracks(rows, { startIndex: 2 });

    expect(playerStore.getState().queue).toBe(entries);
    expect(current()).toBe("c");
  });

  it("clamps a start index past the end of the list", () => {
    playerStore.getState().playTracks(rows, { startIndex: 7 });

    expect(current()).toBe("c");
  });

  it("shuffles into a new order of the same songs and starts from the first", () => {
    playerStore.getState().playTracks(rows, { startIndex: 2, shuffle: true });

    expect(ids().toSorted()).toEqual(["a", "b", "c"]);
    expect(playerStore.getState().currentIndex).toBe(0);
  });

  it("plays next right after the current entry, and queues at the end", () => {
    const { playTracks, playNext, addToQueue } = playerStore.getState();
    playTracks(rows.slice(0, 2));
    const extra = toSongRow(rawSong({ id: "x" }));

    playNext(extra);
    addToQueue(extra);

    expect(ids()).toEqual(["a", "x", "b", "x"]);
    const [, next, , last] = playerStore.getState().queue;
    expect(next?.queueItemId).not.toBe(last?.queueItemId);
  });

  it("keeps the playing entry when an earlier one is removed", () => {
    const { playTracks, removeAt } = playerStore.getState();
    playTracks(rows, { startIndex: 2 });

    removeAt(0);

    expect(ids()).toEqual(["b", "c"]);
    expect(current()).toBe("c");
  });

  it("clears what comes after the current entry and keeps playing it", () => {
    const { playTracks, clearUpNext } = playerStore.getState();
    playTracks(rows, { startIndex: 1 });

    clearUpNext();

    expect(ids()).toEqual(["a", "b"]);
    expect(current()).toBe("b");
  });

  it("moves an entry without changing what plays", () => {
    const { playTracks, moveInQueue } = playerStore.getState();
    playTracks([...rows, toSongRow(rawSong({ id: "d" }))], { startIndex: 1 });

    moveInQueue(3, 2);
    expect(ids()).toEqual(["a", "b", "d", "c"]);
    expect(current()).toBe("b");

    // An entry dragged over the playing one shifts its position.
    moveInQueue(0, 2);
    expect(ids()).toEqual(["b", "d", "a", "c"]);
    expect(current()).toBe("b");
    expect(playerStore.getState().currentIndex).toBe(0);
  });

  it("ignores a move out of range", () => {
    const { playTracks, moveInQueue } = playerStore.getState();
    playTracks(rows);
    const before = playerStore.getState().queue;

    moveInQueue(1, 5);

    expect(playerStore.getState().queue).toBe(before);
  });

  it("stops at the end, or wraps when the whole queue repeats", () => {
    const { playTracks, advanceAfterEnd, cycleRepeat } = playerStore.getState();
    playTracks(rows, { startIndex: 2 });

    advanceAfterEnd();
    expect(current()).toBe("c");

    expect(cycleRepeat()).toBe("playlist");
    advanceAfterEnd();
    expect(current()).toBe("a");
  });

  it("repeats the track on its end, but Next still moves on", () => {
    const { playTracks, advanceAfterEnd, skipToNext, cycleRepeat } =
      playerStore.getState();
    playTracks(rows);
    cycleRepeat();
    expect(cycleRepeat()).toBe("track");

    advanceAfterEnd();
    expect(current()).toBe("a");
    skipToNext();
    expect(current()).toBe("b");
  });

  it("does not skip the only entry when it cannot play", () => {
    const { playTracks, skipUnplayable } = playerStore.getState();
    playTracks(rows.slice(0, 1));

    skipUnplayable();

    expect(current()).toBe("a");
  });
});
