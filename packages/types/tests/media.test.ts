import { describe, expect, it } from "bun:test";

import {
  ensureQueueItemIds,
  newQueueItemId,
  formatDuration,
  getDownloadLink,
  getImageSrc,
  pickShuffleIndex,
  removeFromQueue,
} from "../src/media";
import type { Queue } from "../src/misc";

const SONG_IMAGE =
  "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-150x150.jpg";
const ARTIST_IMAGE = "https://c.saavncdn.com/artists/Sia_002_150x150.jpg";

describe("getImageSrc", () => {
  it("returns the raw URL untouched when no quality is requested", () => {
    expect(getImageSrc(SONG_IMAGE)).toBe(SONG_IMAGE);
  });

  it("resizes hyphen-separated resolution tokens", () => {
    expect(getImageSrc(SONG_IMAGE, "high")).toBe(
      "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-500x500.jpg",
    );
    expect(getImageSrc(SONG_IMAGE, "low")).toBe(
      "https://c.saavncdn.com/679/Thunderclouds-English-2018-20180809032729-50x50.jpg",
    );
  });

  it("resizes underscore-separated resolution tokens", () => {
    expect(getImageSrc(ARTIST_IMAGE, "high")).toBe(
      "https://c.saavncdn.com/artists/Sia_002_500x500.jpg",
    );
  });

  it("honours an explicit width override", () => {
    expect(getImageSrc(ARTIST_IMAGE, "high", 750)).toContain("_750x750.jpg");
  });

  it("upgrades http to https", () => {
    expect(getImageSrc("http://c.saavncdn.com/a-150x150.jpg", "high")).toBe(
      "https://c.saavncdn.com/a-500x500.jpg",
    );
  });

  it("leaves URLs without a resolution token alone", () => {
    const url = "https://c.saavncdn.com/default.jpg";
    expect(getImageSrc(url, "high")).toBe(url);
  });
});

describe("getDownloadLink", () => {
  const links = [
    "https://aac.saavncdn.com/t/x_12.mp4",
    "https://aac.saavncdn.com/t/x_48.mp4",
    "https://aac.saavncdn.com/t/x_96.mp4",
    "https://aac.saavncdn.com/t/x_160.mp4",
    "https://aac.saavncdn.com/t/x_320.mp4",
  ].join(",");

  it("selects a single URL for the requested stream quality", () => {
    expect(getDownloadLink(links, "poor")).toBe(
      "https://aac.saavncdn.com/t/x_12.mp4",
    );
    expect(getDownloadLink(links, "medium")).toBe(
      "https://aac.saavncdn.com/t/x_96.mp4",
    );
    expect(getDownloadLink(links, "excellent")).toBe(
      "https://aac.saavncdn.com/t/x_320.mp4",
    );
  });

  it("never returns the whole comma-separated list", () => {
    expect(getDownloadLink(links, "high")).not.toContain(",");
  });

  it("falls back to the highest bitrate when quality is unknown", () => {
    expect(getDownloadLink(links)).toBe("https://aac.saavncdn.com/t/x_320.mp4");
  });

  it("returns an empty string when there is no download url", () => {
    expect(getDownloadLink("")).toBe("");
  });

  it("returns an empty string for non-string input (undefined download_url)", () => {
    expect(getDownloadLink(undefined)).toBe("");
    expect(getDownloadLink(null)).toBe("");
  });

  it("returns an empty string when every split segment is blank", () => {
    expect(getDownloadLink(" , , ")).toBe("");
  });
});

describe("formatDuration", () => {
  it("formats mm:ss and hh:mm:ss", () => {
    expect(formatDuration(65, "mm:ss")).toBe("01:05");
    expect(formatDuration("3725", "hh:mm:ss")).toBe("01:02:05");
  });

  it("keeps counting minutes past one hour in mm:ss", () => {
    // 1h 01m 40s must not wrap to "01:40"
    expect(formatDuration(3700, "mm:ss")).toBe("61:40");
  });

  it("does not wrap hours after a day", () => {
    expect(formatDuration(90000, "hh:mm:ss")).toBe("25:00:00");
  });

  it("does not throw for missing or non-numeric durations", () => {
    expect(formatDuration(Number.NaN, "mm:ss")).toBe("00:00");
    expect(formatDuration("", "mm:ss")).toBe("00:00");
    expect(formatDuration("abc", "hh:mm:ss")).toBe("00:00:00");
    expect(formatDuration(-5, "mm:ss")).toBe("00:00");
  });
});

describe("pickShuffleIndex", () => {
  it("never returns the current index when another track exists", () => {
    for (let current = 0; current < 4; current++) {
      for (const r of [0, 0.25, 0.5, 0.75, 0.999999]) {
        expect(pickShuffleIndex(4, current, () => r)).not.toBe(current);
      }
    }
  });

  it("can reach every other index", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      seen.add(pickShuffleIndex(4, 1, () => i / 100));
    }
    expect([...seen].sort()).toEqual([0, 2, 3]);
  });

  it("returns the current index for single-track or empty queues", () => {
    expect(pickShuffleIndex(1, 0, () => 0.5)).toBe(0);
    expect(pickShuffleIndex(0, 0, () => 0.5)).toBe(0);
  });
});

describe("removeFromQueue", () => {
  const q = (...ids: string[]) =>
    ids.map((id, i) => ({ id, queueItemId: `q${i}` })) as unknown as Queue[];

  it("keeps the playing track when an earlier one is removed", () => {
    const next = removeFromQueue(q("a", "b", "c", "d"), 2, 0);
    expect(next.queue.map((s) => s.id)).toEqual(["b", "c", "d"]);
    expect(next.currentIndex).toBe(1);
  });

  it("leaves the index alone when a later track is removed", () => {
    const next = removeFromQueue(q("a", "b", "c"), 0, 2);
    expect(next.currentIndex).toBe(0);
  });

  it("clamps when the last track (playing) is removed", () => {
    const next = removeFromQueue(q("a", "b", "c"), 2, 2);
    expect(next.queue).toHaveLength(2);
    expect(next.currentIndex).toBe(1);
  });

  it("resets to 0 when the queue empties", () => {
    const next = removeFromQueue(q("a"), 0, 0);
    expect(next.queue).toHaveLength(0);
    expect(next.currentIndex).toBe(0);
  });

  it("is a no-op for an out-of-range index", () => {
    const queue = q("a", "b");
    expect(removeFromQueue(queue, 1, 5)).toEqual({ queue, currentIndex: 1 });
    expect(removeFromQueue(queue, 1, -1).queue).toBe(queue);
  });

  it("removes only the chosen entry when a track is queued twice", () => {
    const next = removeFromQueue(q("a", "b", "a"), 2, 0);
    expect(next.queue.map((s) => s.queueItemId)).toEqual(["q1", "q2"]);
    expect(next.queue.map((s) => s.id)).toEqual(["b", "a"]);
    expect(next.currentIndex).toBe(1);
  });
});

describe("queue item ids", () => {
  const entry = (id: string, queueItemId?: string) =>
    ({ id, queueItemId }) as unknown as Queue;

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newQueueItemId()));
    expect(ids.size).toBe(200);
  });

  it("backfills legacy entries and re-ids duplicates", () => {
    const next = ensureQueueItemIds([
      entry("a"),
      entry("b", "keep"),
      entry("c", "keep"),
    ]);
    expect(next[1]?.queueItemId).toBe("keep");
    expect(new Set(next.map((s) => s.queueItemId)).size).toBe(3);
    expect(next.every((s) => Boolean(s.queueItemId))).toBe(true);
  });

  it("returns the same array when ids are already unique", () => {
    const queue = [entry("a", "1"), entry("a", "2")];
    expect(ensureQueueItemIds(queue)).toBe(queue);
  });
});
