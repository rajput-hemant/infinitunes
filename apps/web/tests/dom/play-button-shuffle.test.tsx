import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Queue } from "@infinitunes/types";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const fetched: unknown[] = [];
let albumList: unknown[] = [];

mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));
mock.module("~/lib/trpc/client", () => ({
  api: {
    useUtils: () => ({
      album: {
        details: {
          fetch: async (input: unknown) => {
            fetched.push(input);
            return { list: albumList };
          },
        },
      },
    }),
  },
}));

const { PlayButton } = await import("../../components/play-button");
const { useCurrentSongIndex, useIsPlayerInit, useQueue } =
  await import("../../hooks/use-store");

const song = (id: string) => ({
  id,
  title: id,
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  perma_url: `https://www.jiosaavn.com/song/${id}/abc`,
  subtitle: "",
  more_info: { artistMap: { artists: [] }, duration: "100" },
});

const ids = ["a", "b", "c", "d", "e"];
const realRandom = Math.random;
const roots: Root[] = [];

const queued = (id: string): Queue => ({
  queueItemId: `q-${id}`,
  id,
  name: id,
  subtitle: "",
  url: "",
  type: "song",
  image: "",
  artists: [],
  download_url: "",
  duration: 0,
});

/** Random keys for `ids`: sorting by them yields b, d, c, e, a. */
function stubRandomKeys(keys: number[]) {
  let next = 0;
  Math.random = () => keys[next++ % keys.length] ?? 0;
}

async function mount(props: { shuffle?: boolean }) {
  const snapshot = { queue: [] as Queue[], index: -1 };
  const handle = { setQueue: (_q: Queue[]) => {}, reset: () => {} };

  function Probe() {
    const [queue, setQueue] = useQueue();
    const [index, setIndex] = useCurrentSongIndex();
    const [, setInit] = useIsPlayerInit();
    Object.assign(snapshot, { queue, index });
    React.useEffect(() => {
      handle.setQueue = setQueue;
      handle.reset = () => {
        setQueue([]);
        setIndex(-1);
        setInit(false);
      };
    });
    return null;
  }

  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <>
        <Probe />
        <PlayButton type="album" token="alb" {...props}>
          Go
        </PlayButton>
      </>,
    );
  });
  await act(async () => handle.reset());
  const button = container.querySelector("button");
  if (!button) throw new Error("PlayButton did not render");
  return { snapshot, handle, button };
}

afterEach(async () => {
  fetched.length = 0;
  Math.random = realRandom;
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("PlayButton shuffle", () => {
  it("queues the album in a shuffled order with the same items", async () => {
    albumList = ids.map(song);
    const { snapshot, button } = await mount({ shuffle: true });
    stubRandomKeys([0.9, 0.1, 0.5, 0.3, 0.7]);

    await act(async () => button.click());

    const order = snapshot.queue.map((q) => q.id);
    expect(order).toEqual(["b", "d", "c", "e", "a"]);
    expect([...order].sort()).toEqual(ids);
    expect(snapshot.index).toBe(0);
  });

  it("keeps the source order when shuffle is off", async () => {
    albumList = ids.map(song);
    const { snapshot, button } = await mount({});

    await act(async () => button.click());

    expect(snapshot.queue.map((q) => q.id)).toEqual(ids);
  });

  it("reshuffles an album that is already queued instead of only jumping to it", async () => {
    albumList = ids.map(song);
    const { snapshot, handle, button } = await mount({ shuffle: true });
    await act(async () => handle.setQueue(ids.map(queued)));
    stubRandomKeys([0.9, 0.1, 0.5, 0.3, 0.7]);

    await act(async () => button.click());

    expect(fetched).toHaveLength(1);
    expect(snapshot.queue.map((q) => q.id)).toEqual(["b", "d", "c", "e", "a"]);
    expect(snapshot.index).toBe(0);
  });

  it("is labelled Shuffle and keeps the Play label otherwise", async () => {
    const shuffleButton = (await mount({ shuffle: true })).button;
    const playButton = (await mount({})).button;

    expect(shuffleButton.getAttribute("aria-label")).toBe("Shuffle");
    expect(playButton.getAttribute("aria-label")).toBe("Play");
  });
});
