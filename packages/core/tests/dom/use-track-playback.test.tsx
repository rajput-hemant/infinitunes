import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import type { Queue, StreamQuality } from "@infinitunes/types";
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  PLAYBACK_PROBLEM_MESSAGES,
  useTrackPlayback,
} from "../../src/react/use-track-playback";

const urls = (id: string) =>
  `https://cdn/${id}-low.mp3,https://cdn/${id}-high.mp3`;

function entry(id: string, queueItemId: string, url = urls(id)): Queue {
  return {
    id,
    queueItemId,
    name: id,
    subtitle: "",
    url: `https://www.jiosaavn.com/song/${id}/${id}-token`,
    type: "song",
    image: "",
    artists: [],
    download_url: url,
    duration: 180,
  };
}

type Props = {
  queue: Queue[];
  currentIndex: number;
  quality?: StreamQuality;
  loadError?: string;
  isLooping?: boolean;
  isReady?: boolean;
  retry?: number;
};

const roots: Root[] = [];

const messages: string[] = [];

beforeEach(() => {
  messages.length = 0;
});

async function setup(initial: Props) {
  const loads: string[] = [];
  const recorded: string[] = [];
  const loadOptions: { loop: boolean }[] = [];
  const unplayable: string[] = [];
  // The engine: a load makes it not ready (the app re-renders for that), and
  // `loaded()` is the load finishing.
  const engine = { ready: false, force: () => {} };
  const load = (src: string, options: { loop: boolean }) => {
    loads.push(src);
    loadOptions.push(options);
    engine.ready = false;
    engine.force();
  };
  const record = (item: { id: string }) => void recorded.push(item.id);

  function Harness(props: Props) {
    const [, setTick] = useState(0);
    useEffect(() => {
      engine.force = () => setTick((n) => n + 1);
    });
    useTrackPlayback({
      queue: props.queue,
      currentIndex: props.currentIndex,
      streamQuality: props.quality ?? "excellent",
      isPlayerInit: true,
      load,
      record,
      onProblem: (problem) =>
        void messages.push(PLAYBACK_PROBLEM_MESSAGES[problem]),
      loadError: props.loadError,
      isLooping: props.isLooping,
      isReady: props.isReady ?? engine.ready,
      retry: props.retry,
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
  const loaded = () =>
    act(async () => {
      engine.ready = true;
      engine.force();
    });
  return { render, loaded, loads, recorded, loadOptions, unplayable };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("track playback", () => {
  it("loads and records the current entry once", async () => {
    const a = entry("a", "q1");
    const { render, loaded, loads, recorded } = await setup({
      queue: [a],
      currentIndex: 0,
    });

    await loaded();
    await render({ queue: [a], currentIndex: 0 });

    expect(loads).toHaveLength(1);
    expect(recorded).toEqual(["a"]);
  });

  it("records a listen only once the entry has loaded", async () => {
    const a = entry("a", "q1");
    const { loaded, loads, recorded } = await setup({
      queue: [a],
      currentIndex: 0,
    });
    expect(loads).toHaveLength(1);
    expect(recorded).toEqual([]);

    await loaded();

    expect(recorded).toEqual(["a"]);
  });

  it("does not record the next entry on the previous entry's ready state, nor when it never loads", async () => {
    const queue = [entry("a", "q1"), entry("b", "q2", "https://cdn/b_160")];
    const { render, loaded, recorded } = await setup({
      queue,
      currentIndex: 0,
    });
    await loaded();
    expect(recorded).toEqual(["a"]);

    await render({ queue, currentIndex: 1 });
    await render({ queue, currentIndex: 1, loadError: "404" });

    expect(recorded).toEqual(["a"]);
  });

  it("tries an entry again after it stopped on a problem when retry is bumped", async () => {
    const a = entry("a", "q1");
    const { render, loads } = await setup({ queue: [a], currentIndex: 0 });
    for (let n = 0; n < 5; n += 1) {
      await render({ queue: [a], currentIndex: 0, loadError: `e${n}` });
    }
    const before = loads.length;

    await render({ queue: [a], currentIndex: 0, loadError: "e4", retry: 1 });

    expect(loads).toHaveLength(before + 1);
    expect(loads.at(-1)).toBe(loads[0]);
  });

  it("neither reloads nor re-records when entries are queued or removed around the current one", async () => {
    const [a, b, c] = [entry("a", "q1"), entry("b", "q2"), entry("c", "q3")];
    const { render, loaded, loads, recorded } = await setup({
      queue: [a, b],
      currentIndex: 1,
    });
    await loaded();

    await render({ queue: [a, b, c], currentIndex: 1 });
    // Removing an earlier entry shifts the current index but not the entry.
    await render({ queue: [b, c], currentIndex: 0 });

    expect(loads).toHaveLength(1);
    expect(recorded).toEqual(["b"]);
  });

  it("plays and records the same song queued twice in a row", async () => {
    const queue = [entry("a", "q1"), entry("a", "q2")];
    const { render, loaded, loads, recorded } = await setup({
      queue,
      currentIndex: 0,
    });
    await loaded();

    await render({ queue, currentIndex: 1 });
    await loaded();

    expect(loads).toHaveLength(2);
    expect(recorded).toEqual(["a", "a"]);
  });

  it("records a returned-to entry again, and each new entry once", async () => {
    const queue = [entry("a", "q1"), entry("b", "q2")];
    const { render, loaded, recorded } = await setup({
      queue,
      currentIndex: 0,
    });
    await loaded();

    await render({ queue, currentIndex: 1 });
    await loaded();
    await render({ queue, currentIndex: 0 });
    await loaded();

    expect(recorded).toEqual(["a", "b", "a"]);
  });

  it("reloads on a quality change without recording a new listen", async () => {
    const queue = [entry("a", "q1")];
    const { render, loaded, loads, recorded } = await setup({
      queue,
      currentIndex: 0,
      quality: "excellent",
    });
    await loaded();

    await render({ queue, currentIndex: 0, quality: "poor" });
    await loaded();

    expect(loads).toHaveLength(2);
    expect(loads[0]).not.toBe(loads[1]);
    expect(recorded).toEqual(["a"]);
  });

  it("does not load or record an entry with no playable source", async () => {
    const queue = [entry("a", "q1", "")];
    const { loads, recorded } = await setup({ queue, currentIndex: 0 });

    expect(loads).toEqual([]);
    expect(recorded).toEqual([]);
    expect(messages).toEqual([PLAYBACK_PROBLEM_MESSAGES["no-source"]]);
  });

  it("treats a rewritten queueItemId as a new entry", async () => {
    const { render, loaded, loads, recorded } = await setup({
      queue: [entry("a", "q1")],
      currentIndex: 0,
    });
    await loaded();

    await render({ queue: [entry("a", "q9")], currentIndex: 0 });
    await loaded();

    expect(loads).toHaveLength(2);
    expect(recorded).toEqual(["a", "a"]);
  });
});

describe("track playback load failures", () => {
  const ladder =
    "https://cdn/x_12,https://cdn/x_48,https://cdn/x_96,https://cdn/x_160,https://cdn/x_320";

  it("starts at the song's best bitrate, not the 320 it does not have", async () => {
    const song: Queue = { ...entry("a", "q1", ladder), maxQuality: "high" };
    const { loads } = await setup({ queue: [song], currentIndex: 0 });

    expect(loads).toEqual(["https://cdn/x_160"]);
  });

  it("steps down a bitrate on each load error, then gives up once and skips", async () => {
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
    expect(messages).toEqual([]);

    await render({ queue: [song], currentIndex: 0, loadError: "failed" });
    await render({ queue: [song], currentIndex: 0, loadError: "failed 2" });

    expect(loads).toHaveLength(5);
    expect(messages).toEqual(["Couldn't play this song"]);
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

  it("stops after two tracks in a row fail, with one network toast, and starts over after a user action", async () => {
    const two = "https://cdn/x_96,https://cdn/x_160";
    const q = ["a", "b", "c"].map((id, i) => entry(id, `q${i}`, two));
    const { render, unplayable } = await setup({ queue: q, currentIndex: 0 });
    const failTrack = async (currentIndex: number) => {
      for (const loadError of ["e1", undefined, "e2"]) {
        await render({ queue: q, currentIndex, loadError });
      }
    };

    await failTrack(0);
    expect(messages).toEqual(["Couldn't play this song"]);
    expect(unplayable).toHaveLength(1);

    // The player skipped to the next entry, which fails too.
    await render({ queue: q, currentIndex: 1 });
    await failTrack(1);
    expect(messages).toEqual([
      "Couldn't play this song",
      "Can't reach the music server. Check your connection and try again.",
    ]);
    expect(unplayable).toHaveLength(1);

    // The listener picks another track: the count starts over.
    await render({ queue: q, currentIndex: 2 });
    await failTrack(2);
    expect(messages.at(-1)).toBe("Couldn't play this song");
    expect(unplayable).toHaveLength(2);
  });

  it("forgets earlier failures once a track loads", async () => {
    const two = "https://cdn/x_96,https://cdn/x_160";
    const q = ["a", "b"].map((id, i) => entry(id, `q${i}`, two));
    const { render, unplayable } = await setup({ queue: q, currentIndex: 0 });
    for (const loadError of ["e1", undefined, "e2"]) {
      await render({ queue: q, currentIndex: 0, loadError });
    }
    await render({ queue: q, currentIndex: 1, isReady: true });
    await render({ queue: q, currentIndex: 1, isReady: false });
    for (const loadError of ["e1", undefined, "e2"]) {
      await render({ queue: q, currentIndex: 1, loadError });
    }

    expect(messages).toEqual([
      "Couldn't play this song",
      "Couldn't play this song",
    ]);
    expect(unplayable).toHaveLength(2);
  });
});
