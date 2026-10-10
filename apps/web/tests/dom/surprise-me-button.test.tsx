import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Queue } from "@infinitunes/types";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let params = new URLSearchParams();
const fetched: unknown[] = [];
let trending: unknown[] = [];

mock.module("next/navigation", () => ({ useSearchParams: () => params }));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));
mock.module("~/lib/trpc/client", () => ({
  api: {
    useUtils: () => ({
      get: {
        trending: {
          fetch: async (input: unknown) => {
            fetched.push(input);
            return trending;
          },
        },
      },
    }),
  },
}));

const { SurpriseMeButton } =
  await import("../../components/site-header/surprise-me-button");
const { useCurrentSongIndex, useIsPlayerInit, useQueue } =
  await import("../../hooks/use-store");

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

async function mount() {
  const snapshot = { queue: [] as Queue[], index: -1, init: false };
  const handle = { reset: () => {} };
  function Probe() {
    const [queue, setQueue] = useQueue();
    const [index, setIndex] = useCurrentSongIndex();
    const [init, setInit] = useIsPlayerInit();
    Object.assign(snapshot, { queue, index, init });
    // The store is module-global: start every test from an empty idle player.
    React.useEffect(() => {
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
        <SurpriseMeButton />
      </>,
    );
  });
  await act(async () => handle.reset());
  return { snapshot, button: container.querySelector("button")! };
}

afterEach(async () => {
  fetched.length = 0;
  params = new URLSearchParams();
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("SurpriseMeButton", () => {
  it("replaces the queue with the trending songs for the page language and plays from the start", async () => {
    params = new URLSearchParams("lang=tamil");
    trending = [item("a"), item("b"), item("alb", "album"), item("c")];
    const { snapshot, button } = await mount();

    await act(async () => button.click());

    expect(fetched).toEqual([{ type: "song", lang: "tamil" }]);
    expect(snapshot.queue.map((q) => q.id).sort()).toEqual(["a", "b", "c"]);
    expect(snapshot.index).toBe(0);
    expect(snapshot.init).toBe(true);
  });

  it("leaves the queue alone when nothing comes back", async () => {
    trending = [];
    const { snapshot, button } = await mount();

    await act(async () => button.click());

    expect(snapshot.queue).toEqual([]);
    expect(snapshot.init).toBe(false);
  });
});
