import { afterEach, describe, expect, it, mock } from "bun:test";

import type { ActiveRadioSession, Queue } from "@infinitunes/types";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let params = new URLSearchParams();
const fetched: unknown[] = [];
let trending: unknown[] = [];
let fetchResult: () => Promise<unknown[]> = async () => trending;

mock.module("next/navigation", () => ({ useSearchParams: () => params }));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));
mock.module("~/lib/trpc/client", () => ({
  api: {
    useUtils: () => ({
      get: {
        trending: {
          fetch: async (input: unknown) => {
            fetched.push(input);
            return fetchResult();
          },
        },
      },
    }),
  },
}));

const { SurpriseMeButton } =
  await import("../../components/site-header/surprise-me-button");
const {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} = await import("../../hooks/use-store");

const item = (id: string, type = "song") => ({
  id,
  title: id,
  type,
  image: "https://c.saavncdn.com/x-150x150.jpg",
  perma_url: `https://www.jiosaavn.com/song/${id}/abc`,
  subtitle: "",
  more_info: { artistMap: { artists: [] }, duration: "100" },
});

const roots: Root[] = [];
const realRandom = Math.random;

const radio: ActiveRadioSession = {
  stationId: "s1",
  name: "Station",
  type: "featured",
};
const seeded = (id: string) =>
  ({ queueItemId: `q-${id}`, id, name: id }) as unknown as Queue;

async function mount(onQueued?: () => void) {
  const snapshot = {
    queue: [] as Queue[],
    index: -1,
    init: false,
    radio: null as ActiveRadioSession | null,
  };
  const handle = {
    reset: () => {},
    setQueue: (_q: Queue[]) => {},
    setIndex: (_i: number) => {},
    setRadio: (_r: ActiveRadioSession | null) => {},
  };
  function Probe() {
    const [queue, setQueue] = useQueue();
    const [index, setIndex] = useCurrentSongIndex();
    const [init, setInit] = useIsPlayerInit();
    const [activeRadio, setRadio] = useActiveRadioSession();
    Object.assign(snapshot, { queue, index, init, radio: activeRadio });
    // The store is module-global: start every test from an empty idle player.
    React.useEffect(() => {
      handle.reset = () => {
        setQueue([]);
        setIndex(-1);
        setInit(false);
        setRadio(null);
      };
      handle.setQueue = setQueue;
      handle.setIndex = setIndex;
      handle.setRadio = setRadio;
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
        <SurpriseMeButton onQueued={onQueued} />
      </>,
    );
  });
  await act(async () => handle.reset());
  return { snapshot, handle, button: container.querySelector("button")! };
}

afterEach(async () => {
  fetched.length = 0;
  fetchResult = async () => trending;
  Math.random = realRandom;
  params = new URLSearchParams();
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("SurpriseMeButton", () => {
  it("replaces the queue and radio with the trending songs for the page language and plays from the start", async () => {
    params = new URLSearchParams("lang=tamil");
    trending = [item("a"), item("b"), item("alb", "album"), item("c")];
    const onQueued = mock(() => {});
    const { snapshot, handle, button } = await mount(onQueued);
    await act(async () => {
      handle.setQueue([seeded("old")]);
      handle.setRadio(radio);
    });

    await act(async () => button.click());

    expect(fetched).toEqual([{ type: "song", lang: "tamil" }]);
    expect(snapshot.queue.map((q) => q.id).sort()).toEqual(["a", "b", "c"]);
    expect(snapshot.index).toBe(0);
    expect(snapshot.init).toBe(true);
    expect(snapshot.radio).toBeNull();
    expect(onQueued).toHaveBeenCalledTimes(1);
  });

  it("shuffles the songs", async () => {
    trending = ["a", "b", "c", "d"].map((id) => item(id));
    // Always picking index 0 turns the Fisher-Yates pass into a rotation.
    Math.random = () => 0;
    const { snapshot, button } = await mount();

    await act(async () => button.click());

    expect(snapshot.queue.map((q) => q.id)).toEqual(["b", "c", "d", "a"]);
  });

  it("keeps the queue and radio when nothing comes back", async () => {
    trending = [];
    const onQueued = mock(() => {});
    const { snapshot, handle, button } = await mount(onQueued);
    await act(async () => {
      handle.setQueue([seeded("old")]);
      handle.setRadio(radio);
    });

    await act(async () => button.click());

    expect(snapshot.queue.map((q) => q.id)).toEqual(["old"]);
    expect(snapshot.radio).toEqual(radio);
    expect(snapshot.init).toBe(false);
    expect(onQueued).not.toHaveBeenCalled();
  });

  it("keeps the queue and radio when the fetch fails", async () => {
    fetchResult = async () => {
      throw new Error("boom");
    };
    const onQueued = mock(() => {});
    const { snapshot, handle, button } = await mount(onQueued);
    await act(async () => {
      handle.setQueue([seeded("old")]);
      handle.setRadio(radio);
    });

    await act(async () => button.click());

    expect(snapshot.queue.map((q) => q.id)).toEqual(["old"]);
    expect(snapshot.radio).toEqual(radio);
    expect(onQueued).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
  });

  it("ignores clicks while a fetch is pending", async () => {
    trending = [item("a")];
    let release = () => {};
    fetchResult = () =>
      new Promise((resolve) => {
        release = () => resolve(trending);
      });
    const { snapshot, button } = await mount();

    await act(async () => button.click());
    expect(button.disabled).toBe(true);
    await act(async () => button.click());
    expect(fetched).toHaveLength(1);

    await act(async () => release());
    expect(snapshot.queue.map((q) => q.id)).toEqual(["a"]);
    expect(button.disabled).toBe(false);
  });

  it("discards a pending result when playback changed in the meantime", async () => {
    trending = [item("a")];
    let release = () => {};
    fetchResult = () =>
      new Promise((resolve) => {
        release = () => resolve(trending);
      });
    const onQueued = mock(() => {});
    const { snapshot, handle, button } = await mount(onQueued);

    await act(async () => button.click());
    await act(async () => handle.setQueue([seeded("newer")]));
    await act(async () => release());

    expect(snapshot.queue.map((q) => q.id)).toEqual(["newer"]);
    expect(snapshot.init).toBe(false);
    expect(onQueued).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
  });
});
