import { afterEach, describe, expect, it } from "bun:test";

import type { ActiveRadioSession, Queue, Song } from "@infinitunes/types";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { PlayAllButton } from "../../components/library/play-all-button";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "../../hooks/use-store";

const song = (id: string) =>
  ({
    id,
    title: id,
    type: "song",
    image: "https://c.saavncdn.com/x-150x150.jpg",
    perma_url: `https://www.jiosaavn.com/song/${id}/abc`,
    subtitle: "",
    more_info: { artistMap: { artists: [] }, duration: "100" },
  }) as unknown as Song;

const radio: ActiveRadioSession = {
  stationId: "s1",
  name: "Station",
  type: "featured",
};

const roots: Root[] = [];

type Snapshot = {
  queue: Queue[];
  index: number;
  init: boolean;
  radio: ActiveRadioSession | null;
};

async function mount(items: Song[]) {
  const snapshot = {} as Snapshot;
  const handle = { reset: () => {} };

  function Probe() {
    const [queue, setQueue] = useQueue();
    const [index, setIndex] = useCurrentSongIndex();
    const [init, setInit] = useIsPlayerInit();
    const [active, setActive] = useActiveRadioSession();
    Object.assign(snapshot, { queue, index, init, radio: active });
    // The store is module-global: start each test from a playing radio queue
    // away from index 0 so every reset below is observable.
    React.useEffect(() => {
      handle.reset = () => {
        setQueue([]);
        setIndex(1);
        setInit(false);
        setActive(radio);
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
        <PlayAllButton items={items} />
      </>,
    );
  });
  await act(async () => handle.reset());
  return { snapshot, button: container.querySelector("button")! };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("PlayAllButton", () => {
  it("queues the resolved songs in order, starts at the first and clears the radio session", async () => {
    const { snapshot, button } = await mount([song("a"), song("b"), song("c")]);

    await act(async () => button.click());

    expect(snapshot.queue.map((q) => q.id)).toEqual(["a", "b", "c"]);
    expect(snapshot.index).toBe(0);
    expect(snapshot.init).toBe(true);
    expect(snapshot.radio).toBeNull();
  });

  it("gives every queued entry its own queueItemId, including a repeated song", async () => {
    const { snapshot, button } = await mount([song("a"), song("a")]);

    await act(async () => button.click());

    const entryIds = snapshot.queue.map((q) => q.queueItemId);
    expect(new Set(entryIds).size).toBe(2);
  });

  it("leaves the queue and radio session alone when there is nothing to play", async () => {
    const { snapshot, button } = await mount([]);

    await act(async () => button.click());

    expect(snapshot.queue).toEqual([]);
    expect(snapshot.radio).toEqual(radio);
  });
});
