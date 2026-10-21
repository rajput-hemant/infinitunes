import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";

import type { ActiveRadioSession, Queue, Song } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  REFILL_RETRY_BASE_MS,
  useRadioRefill,
} from "../../src/react/use-radio-refill";

const station = (stationId: string): ActiveRadioSession => ({
  stationId,
  name: stationId,
  type: "featured",
});

const song = (id: string) => rawSong({ id });

const queued = (id: string): Queue => toQueue(song(id));

type Props = {
  activeRadio: ActiveRadioSession | null;
  queue: Queue[];
  currentIndex: number;
};

const roots: Root[] = [];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function setup(initial: Props) {
  const calls: string[] = [];
  const pending: ReturnType<typeof deferred<Song[]>>[] = [];
  let queue = initial.queue;
  const fetchSongs = (stationId: string) => {
    calls.push(stationId);
    const d = deferred<Song[]>();
    pending.push(d);
    return d.promise;
  };
  const setQueue = (update: (prev: Queue[]) => Queue[]) => {
    queue = update(queue);
  };

  function Harness(props: Props) {
    useRadioRefill({ ...props, fetchSongs, setQueue });
    return null;
  }

  const root = createRoot(document.createElement("div"));
  roots.push(root);
  const render = (props: Partial<Props> = {}) =>
    act(async () => {
      if (props.queue) queue = props.queue;
      root.render(<Harness {...initial} {...props} queue={queue} />);
    });
  const settle = (index: number, songs: Song[] | Error) =>
    act(async () => {
      if (songs instanceof Error) pending[index]!.reject(songs);
      else pending[index]!.resolve(songs);
      await pending[index]!.promise.catch(() => {});
    });
  await render();
  const enqueue = (item: Queue) => {
    queue = [...queue, item];
    return render();
  };
  return { render, settle, enqueue, calls, getQueue: () => queue };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

const ids = (queue: Queue[]) => queue.map((q) => q.id);

describe("radio refill", () => {
  it("does nothing without an active radio session", async () => {
    const { calls } = await setup({
      activeRadio: null,
      queue: [queued("a")],
      currentIndex: 0,
    });

    expect(calls).toEqual([]);
  });

  it("does not refill while more than three entries remain", async () => {
    const { calls } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b", "c", "d", "e"].map(queued),
      currentIndex: 0,
    });

    expect(calls).toEqual([]);
  });

  it("refills when three entries remain, once while the fetch is in flight", async () => {
    const { render, calls } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b", "c", "d", "e"].map(queued),
      currentIndex: 2,
    });

    await render({ currentIndex: 3 });

    expect(calls).toEqual(["s1"]);
  });

  it("appends only songs not already queued", async () => {
    const { settle, getQueue } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b"].map(queued),
      currentIndex: 0,
    });

    await settle(0, [song("b"), song("c"), song("d")]);

    expect(ids(getQueue())).toEqual(["a", "b", "c", "d"]);
  });

  it("retries on the next position change after a failed refill", async () => {
    const { render, settle, calls, getQueue } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b"].map(queued),
      currentIndex: 0,
    });

    await settle(0, new Error("upstream down"));
    await render({ currentIndex: 1 });

    expect(calls).toEqual(["s1", "s1"]);
    expect(ids(getQueue())).toEqual(["a", "b"]);
  });

  it("drops a refill that resolves after the station changed", async () => {
    const { render, settle, getQueue } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b"].map(queued),
      currentIndex: 0,
    });

    await render({
      activeRadio: station("s2"),
      queue: ["x", "y"].map(queued),
      currentIndex: 0,
    });
    await settle(0, [song("late-1"), song("late-2")]);

    expect(ids(getQueue())).toEqual(["x", "y"]);
  });

  it("refills the new station after a station change while a fetch was in flight", async () => {
    const { render, settle, calls } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b"].map(queued),
      currentIndex: 0,
    });

    await render({
      activeRadio: station("s2"),
      queue: ["x", "y"].map(queued),
      currentIndex: 0,
    });
    await settle(0, [song("late")]);

    expect(calls).toEqual(["s1", "s2"]);
  });

  describe("retry while playback sits on the last entry", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const advance = (ms: number) =>
      act(async () => {
        jest.advanceTimersByTime(ms);
      });

    it("retries a failed refill with a doubling delay, nothing else changing", async () => {
      const { settle, calls } = await setup({
        activeRadio: station("s1"),
        queue: ["a", "b"].map(queued),
        currentIndex: 1,
      });

      await settle(0, new Error("upstream down"));
      await advance(REFILL_RETRY_BASE_MS - 1);
      expect(calls).toEqual(["s1"]);
      await advance(1);
      expect(calls).toEqual(["s1", "s1"]);

      await settle(1, new Error("still down"));
      await advance(REFILL_RETRY_BASE_MS * 2 - 1);
      expect(calls).toHaveLength(2);
      await advance(1);
      expect(calls).toHaveLength(3);
    });

    it("retries a batch that brought only songs already queued", async () => {
      const { settle, calls, getQueue } = await setup({
        activeRadio: station("s1"),
        queue: ["a", "b"].map(queued),
        currentIndex: 1,
      });

      await settle(0, [song("a"), song("b")]);
      await advance(REFILL_RETRY_BASE_MS);
      expect(calls).toEqual(["s1", "s1"]);

      await settle(1, [song("c")]);
      expect(ids(getQueue())).toEqual(["a", "b", "c"]);
    });

    it("drops the pending retry once a newer refill starts", async () => {
      const { render, settle, calls, getQueue } = await setup({
        activeRadio: station("s1"),
        queue: ["a", "b", "c"].map(queued),
        currentIndex: 1,
      });

      await settle(0, new Error("upstream down"));
      await render({ currentIndex: 2 });
      await settle(1, [song("d"), song("e"), song("f"), song("g")]);
      await advance(REFILL_RETRY_BASE_MS * 4);

      expect(calls).toEqual(["s1", "s1"]);
      expect(ids(getQueue())).toEqual(["a", "b", "c", "d", "e", "f", "g"]);

      // The backoff starts over: the next failure retries after the base delay.
      await render({ currentIndex: 4 });
      await settle(2, new Error("upstream down"));
      await advance(REFILL_RETRY_BASE_MS);
      expect(calls).toHaveLength(4);
    });

    it("drops the pending retry when the station changes", async () => {
      const { render, settle, calls } = await setup({
        activeRadio: station("s1"),
        queue: ["a", "b"].map(queued),
        currentIndex: 1,
      });

      await settle(0, new Error("upstream down"));
      await render({ activeRadio: null });
      await advance(REFILL_RETRY_BASE_MS * 4);

      expect(calls).toEqual(["s1"]);
    });

    it("drops the pending retry on unmount", async () => {
      const { settle, calls } = await setup({
        activeRadio: station("s1"),
        queue: ["a", "b"].map(queued),
        currentIndex: 1,
      });

      await settle(0, new Error("upstream down"));
      await act(async () => roots.splice(0).forEach((r) => r.unmount()));
      await advance(REFILL_RETRY_BASE_MS * 4);

      expect(calls).toEqual(["s1"]);
    });
  });

  it("does not duplicate songs queued while the refill was in flight", async () => {
    const { settle, enqueue, getQueue } = await setup({
      activeRadio: station("s1"),
      queue: ["a", "b"].map(queued),
      currentIndex: 0,
    });

    await enqueue(queued("c"));
    await settle(0, [song("c"), song("d")]);

    expect(ids(getQueue()).filter((id) => id === "c")).toHaveLength(1);
  });
});
