import { describe, expect, it } from "bun:test";

import {
  findQueueIndex,
  isCurrentTrack,
  playToRecord,
} from "../lib/queue-position";

const queue = [
  { id: "a", queueItemId: "q1", url: "https://x/song/a/tokA" },
  { id: "b", queueItemId: "q2", url: "https://x/song/b/tokB" },
  { id: "a", queueItemId: "q3", url: "https://x/song/a/tokA" },
];

describe("isCurrentTrack", () => {
  it("highlights only the playing copy of a duplicated queue row", () => {
    const row = (queueItemId: string) => ({ id: "a", queueItemId });
    expect(isCurrentTrack(queue, 0, row("q1"))).toBe(true);
    expect(isCurrentTrack(queue, 0, row("q3"))).toBe(false);
    expect(isCurrentTrack(queue, 2, row("q1"))).toBe(false);
    expect(isCurrentTrack(queue, 2, row("q3"))).toBe(true);
  });

  it("falls back to the track id for rows that are not queue entries", () => {
    expect(isCurrentTrack(queue, 2, { id: "a" })).toBe(true);
    expect(isCurrentTrack(queue, 1, { id: "a" })).toBe(false);
    expect(isCurrentTrack(queue, 0, { id: "a", queueItemId: "gone" })).toBe(
      true,
    );
  });

  it("is false for an empty or out-of-range queue", () => {
    expect(isCurrentTrack([], 0, { id: "a" })).toBe(false);
    expect(isCurrentTrack(queue, 9, { id: "a" })).toBe(false);
  });
});

describe("findQueueIndex", () => {
  it("jumps to the exact queue entry when given its queueItemId", () => {
    expect(findQueueIndex(queue, { token: "tokA", queueItemId: "q3" })).toBe(2);
  });

  it("falls back to the first token match otherwise", () => {
    expect(findQueueIndex(queue, { token: "tokA" })).toBe(0);
    expect(findQueueIndex(queue, { token: "tokB", queueItemId: "gone" })).toBe(
      1,
    );
    expect(findQueueIndex(queue, { token: "nope" })).toBe(-1);
  });
});

describe("playToRecord", () => {
  const track = (queueItemId: string, type: "song" | "episode" = "song") => ({
    id: "a",
    queueItemId,
    type,
  });

  it("records a new queue entry", () => {
    expect(playToRecord(track("q1"), null)).toEqual({ id: "a", type: "song" });
    expect(playToRecord(track("q2"), "q1")).toEqual({ id: "a", type: "song" });
  });

  it("does not re-record the entry that was just recorded", () => {
    expect(playToRecord(track("q1"), "q1")).toBeNull();
  });

  it("records the same song queued again, since its queueItemId differs", () => {
    expect(playToRecord(track("q3"), "q1")).not.toBeNull();
  });

  it("maps episodes and ignores an empty queue", () => {
    expect(playToRecord(track("q1", "episode"), null)?.type).toBe("episode");
    expect(playToRecord(undefined, null)).toBeNull();
  });
});
