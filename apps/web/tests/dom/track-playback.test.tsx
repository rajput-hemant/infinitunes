import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Queue, StreamQuality } from "@infinitunes/types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useTrackPlayback } from "../../hooks/use-track-playback";

const urls = (id: string) =>
  `https://cdn/${id}-low.mp3,https://cdn/${id}-high.mp3`;

function entry(id: string, queueItemId: string, url = urls(id)): Queue {
  return {
    id,
    queueItemId,
    name: id,
    type: "song",
    download_url: url,
  } as unknown as Queue;
}

type Props = {
  queue: Queue[];
  currentIndex: number;
  quality?: StreamQuality;
  loadError?: string;
  isLooping?: boolean;
};

const roots: Root[] = [];

async function setup(initial: Props) {
  const loads: string[] = [];
  const recorded: string[] = [];
  const loadOptions: { loop: boolean }[] = [];
  const unplayable: string[] = [];
  const load = (src: string, options: { loop: boolean }) => {
    loads.push(src);
    loadOptions.push(options);
  };
  const onEnd = () => {};
  const record = (item: { id: string }) => void recorded.push(item.id);

  function Harness(props: Props) {
    useTrackPlayback({
      queue: props.queue,
      currentIndex: props.currentIndex,
      streamQuality: props.quality ?? "excellent",
      isPlayerInit: true,
      load,
      onEnd,
      record,
      loadError: props.loadError,
      isLooping: props.isLooping,
      onUnplayable: () => void unplayable.push("skip"),
    });
    return null;
  }

  const root = createRoot(document.createElement("div"));
  roots.push(root);
  const render = (props: Props) =>
    act(async () => {
      root.render(<Harness {...props} />);
    });
  await render(initial);
  return { render, loads, recorded, loadOptions, unplayable };
}

const toasts: string[] = [];
mock.module("sonner", () => ({
  toast: { error: (m: string) => void toasts.push(m), success() {} },
}));

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("track playback", () => {
  it("loads and records the current entry once", async () => {
    const a = entry("a", "q1");
    const { render, loads, recorded } = await setup({
      queue: [a],
      currentIndex: 0,
    });

    await render({ queue: [a], currentIndex: 0 });

    expect(loads).toHaveLength(1);
    expect(recorded).toEqual(["a"]);
  });

  it("neither reloads nor re-records when entries are queued or removed around the current one", async () => {
    const [a, b, c] = [entry("a", "q1"), entry("b", "q2"), entry("c", "q3")];
    const { render, loads, recorded } = await setup({
      queue: [a, b],
      currentIndex: 1,
    });

    await render({ queue: [a, b, c], currentIndex: 1 });
    // Removing an earlier entry shifts the current index but not the entry.
    await render({ queue: [b, c], currentIndex: 0 });

    expect(loads).toHaveLength(1);
    expect(recorded).toEqual(["b"]);
  });

  it("plays and records the same song queued twice in a row", async () => {
    const queue = [entry("a", "q1"), entry("a", "q2")];
    const { render, loads, recorded } = await setup({ queue, currentIndex: 0 });

    await render({ queue, currentIndex: 1 });

    expect(loads).toHaveLength(2);
    expect(recorded).toEqual(["a", "a"]);
  });

  it("records a returned-to entry again, and each new entry once", async () => {
    const queue = [entry("a", "q1"), entry("b", "q2")];
    const { render, recorded } = await setup({ queue, currentIndex: 0 });

    await render({ queue, currentIndex: 1 });
    await render({ queue, currentIndex: 0 });

    expect(recorded).toEqual(["a", "b", "a"]);
  });

  it("reloads on a quality change without recording a new listen", async () => {
    const queue = [entry("a", "q1")];
    const { render, loads, recorded } = await setup({
      queue,
      currentIndex: 0,
      quality: "excellent",
    });

    await render({ queue, currentIndex: 0, quality: "poor" });

    expect(loads).toHaveLength(2);
    expect(loads[0]).not.toBe(loads[1]);
    expect(recorded).toEqual(["a"]);
  });

  it("does not load or record an entry with no playable source", async () => {
    const queue = [entry("a", "q1", "")];
    const { loads, recorded } = await setup({ queue, currentIndex: 0 });

    expect(loads).toEqual([]);
    expect(recorded).toEqual([]);
  });

  it("treats a rewritten queueItemId as a new entry", async () => {
    const { render, loads, recorded } = await setup({
      queue: [entry("a", "q1")],
      currentIndex: 0,
    });

    await render({ queue: [entry("a", "q9")], currentIndex: 0 });

    expect(loads).toHaveLength(2);
    expect(recorded).toEqual(["a", "a"]);
  });
});

describe("track playback load failures", () => {
  const ladder =
    "https://cdn/x_12,https://cdn/x_48,https://cdn/x_96,https://cdn/x_160,https://cdn/x_320";

  it("starts at the song's best bitrate, not the 320 it does not have", async () => {
    const song = { ...entry("a", "q1", ladder), maxQuality: "high" } as Queue;
    const { loads } = await setup({ queue: [song], currentIndex: 0 });

    expect(loads).toEqual(["https://cdn/x_160"]);
  });

  it("steps down a bitrate on each load error, then gives up once and skips", async () => {
    toasts.length = 0;
    const song = entry("a", "q1", ladder);
    const { render, loads, unplayable } = await setup({
      queue: [song],
      currentIndex: 0,
    });
    expect(loads).toEqual(["https://cdn/x_320"]);

    // Each failed load clears the error, then the next one fails.
    for (const rate of ["160", "96", "48", "12"]) {
      await render({ queue: [song], currentIndex: 0, loadError: "failed" });
      expect(loads.at(-1)).toBe(`https://cdn/x_${rate}`);
      await render({ queue: [song], currentIndex: 0 });
    }
    expect(toasts).toEqual([]);

    await render({ queue: [song], currentIndex: 0, loadError: "failed" });
    await render({ queue: [song], currentIndex: 0, loadError: "failed 2" });

    expect(loads).toHaveLength(5);
    expect(toasts).toEqual(["Couldn't play this song"]);
    expect(unplayable).toEqual(["skip"]);
  });

  it("does not charge the previous track's error to the next track", async () => {
    const [a, b] = [entry("a", "q1", ladder), entry("b", "q2", ladder)];
    const { render, loads } = await setup({ queue: [a, b], currentIndex: 0 });
    await render({ queue: [a, b], currentIndex: 0, loadError: "failed" });
    await render({ queue: [a, b], currentIndex: 1, loadError: "failed" });

    expect(loads.at(-1)).toBe("https://cdn/x_320");
  });

  it("keeps repeat-one across the load of the next track", async () => {
    const [a, b] = [entry("a", "q1"), entry("b", "q2")];
    const { render, loadOptions } = await setup({
      queue: [a, b],
      currentIndex: 0,
      isLooping: true,
    });
    await render({ queue: [a, b], currentIndex: 1, isLooping: true });

    expect(loadOptions.map((o) => o.loop)).toEqual([true, true]);
  });
});
