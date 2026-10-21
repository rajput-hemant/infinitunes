import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";

import { playerStore, selectCurrentTrack } from "./player-store";

const rows = ["a", "b", "c"].map((id) => toSongRow(rawSong({ id })));
const state = () => playerStore.getState();
const ids = () => state().queue.map((entry) => entry.id);
const current = () => selectCurrentTrack(state())?.id;

const initial = playerStore.getState();
beforeEach(() => playerStore.setState(initial, true));

describe("playTracks", () => {
  it("ignores an empty list and keeps what is queued", () => {
    state().playTracks(rows);

    state().playTracks([]);

    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("asks the engine to restart the track that is already loaded and pressed again", () => {
    state().playTracks(rows, { startIndex: 1 });
    const before = state().resumeRequest;

    state().playTracks(rows, { startIndex: 1 });
    expect(state().resumeRequest).toBe(before + 1);

    // A different row of the same list only moves; the loaded track is untouched.
    state().playTracks(rows, { startIndex: 2 });
    expect(state().resumeRequest).toBe(before + 1);
  });

  it("does not ask for a restart when the restored queue is played for the first time", () => {
    state().playTracks(rows, { startIndex: 1 });
    playerStore.setState({ started: false });
    const before = state().resumeRequest;

    state().playTracks(rows, { startIndex: 1 });

    expect(state().started).toBe(true);
    expect(state().resumeRequest).toBe(before);
  });

  it("replaces the queue for a different list and drops a radio the new list is not part of", () => {
    state().playTracks(rows, {
      radio: { stationId: "s", name: "Radio", type: "artist" },
    });
    expect(state().radio?.stationId).toBe("s");

    state().playTracks(rows.slice(0, 2));

    expect(ids()).toEqual(["a", "b"]);
    expect(state().radio).toBeNull();
  });

  it("clamps a negative start index to the first row", () => {
    state().playTracks(rows, { startIndex: -3 });
    expect(current()).toBe("a");
  });

  it("gives every queued copy of one song its own entry id", () => {
    state().playTracks([rows[0]!, rows[0]!]);
    const [first, second] = state().queue;
    expect(first?.id).toBe(second?.id);
    expect(first?.queueItemId).not.toBe(second?.queueItemId);
  });
});

describe("start and playAt", () => {
  it("does not start an empty queue", () => {
    state().start();
    expect(state().started).toBe(false);
  });

  it("ignores a position outside the queue", () => {
    state().playTracks(rows);
    playerStore.setState({ started: false });

    state().playAt(3);
    state().playAt(-1);

    expect(state().currentIndex).toBe(0);
    expect(state().started).toBe(false);
  });

  it("jumps to a queued entry and starts", () => {
    state().playTracks(rows);
    state().playAt(2);
    expect(current()).toBe("c");
  });
});

describe("skipping", () => {
  it("steps back, stops at the first entry, and wraps back when looping", () => {
    state().playTracks(rows, { startIndex: 1 });
    state().skipToPrevious();
    expect(current()).toBe("a");

    state().skipToPrevious();
    expect(current()).toBe("a");

    state().cycleRepeat();
    state().skipToPrevious();
    expect(current()).toBe("c");
  });

  it("stops at the last entry on Next unless the queue loops", () => {
    state().playTracks(rows, { startIndex: 2 });
    state().skipToNext();
    expect(current()).toBe("c");

    state().cycleRepeat();
    state().skipToNext();
    expect(current()).toBe("a");
  });

  it("asks the engine to replay a one-entry queue that loops onto itself", () => {
    state().playTracks(rows.slice(0, 1));
    playerStore.setState({ repeat: "playlist" });
    const before = state().resumeRequest;

    state().advanceAfterEnd();

    expect(state().currentIndex).toBe(0);
    expect(state().resumeRequest).toBe(before + 1);
  });

  it("leaves repeat-one to the engine's own loop", () => {
    state().playTracks(rows.slice(0, 1));
    playerStore.setState({ repeat: "track" });
    const before = state().resumeRequest;

    state().advanceAfterEnd();

    expect(state().resumeRequest).toBe(before);
  });

  it("moves past an entry that cannot play when others are queued", () => {
    state().playTracks(rows);
    state().skipUnplayable();
    expect(current()).toBe("b");
  });

  it("shuffles to a different entry of the queue", () => {
    state().playTracks(rows);
    playerStore.setState({ shuffle: true });

    state().skipToNext();

    expect(state().currentIndex).not.toBe(0);
    expect(state().queue).toHaveLength(3);
  });
});

describe("queue edits", () => {
  it("plays a song next into an empty queue at the front", () => {
    state().playNext(rows[0]!);
    expect(ids()).toEqual(["a"]);
  });

  it("removes the entry after the playing one without moving playback", () => {
    state().playTracks(rows, { startIndex: 1 });
    state().removeAt(2);
    expect(ids()).toEqual(["a", "b"]);
    expect(current()).toBe("b");
  });

  it("keeps the position valid when the playing entry is the one removed", () => {
    state().playTracks(rows, { startIndex: 2 });

    state().removeAt(2);

    expect(ids()).toEqual(["a", "b"]);
    expect(selectCurrentTrack(state())).toBeDefined();
  });

  it("clears nothing when the playing entry is the last", () => {
    state().playTracks(rows, { startIndex: 2 });
    state().clearUpNext();
    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("ignores moving an entry onto itself or from outside the queue", () => {
    state().playTracks(rows);
    const before = state().queue;

    state().moveInQueue(1, 1);
    state().moveInQueue(5, 0);
    state().moveInQueue(0, -1);

    expect(state().queue).toBe(before);
  });

  it("applies a refill without moving playback", () => {
    state().playTracks(rows, { startIndex: 1 });

    state().updateQueue((queue) => [...queue, ...queue.slice(0, 1)]);

    expect(ids()).toEqual(["a", "b", "c", "a"]);
    expect(current()).toBe("b");
  });
});

describe("repeat", () => {
  it("cycles off, playlist, track for a queue and toggles track for a single song", () => {
    state().playTracks(rows);
    expect([
      state().cycleRepeat(),
      state().cycleRepeat(),
      state().cycleRepeat(),
    ]).toEqual(["playlist", "track", "off"]);

    state().playTracks(rows.slice(0, 1));
    expect([state().cycleRepeat(), state().cycleRepeat()]).toEqual([
      "track",
      "off",
    ]);
  });
});
