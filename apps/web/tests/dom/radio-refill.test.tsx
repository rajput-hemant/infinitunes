import { afterEach, describe, expect, it } from "bun:test";

import type { ActiveRadioSession, Queue, Song } from "@infinitunes/types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useRadioRefill } from "../../hooks/use-radio-refill";

const station = (stationId: string): ActiveRadioSession => ({
  stationId,
  name: stationId,
  type: "featured",
});

const queued = (id: string): Queue =>
  ({ id, queueItemId: `q-${id}`, name: id, type: "song" }) as unknown as Queue;

const song = (id: string) =>
  ({
    id,
    title: id,
    type: "song",
    image: "",
    perma_url: "",
    more_info: {},
  }) as unknown as Song;

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
