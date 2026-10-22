import { afterEach, describe, expect, it, mock } from "bun:test";

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const errors: string[] = [];
let albumResult: () => Promise<unknown> = async () => ({ list: [] });

mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
mock.module("sonner", () => ({
  toast: {
    success() {},
    error: (message: string) => errors.push(message),
  },
}));
mock.module("~/lib/trpc/vanilla", () => ({
  trpc: { album: { details: { query: () => albumResult() } } },
}));

mock.module("react-use-audio-player", () => ({
  useAudioPlayerContext: () => ({ isPlaying: false, play() {} }),
}));

const { PlayButton } = await import("../../components/play-button");
const { useQueue } = await import("../../hooks/use-store");

const roots: Root[] = [];

async function mount() {
  const snapshot = { queue: [] as unknown[] };
  function Probe() {
    const [queue] = useQueue();
    Object.assign(snapshot, { queue });
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
        <PlayButton type="album" token="alb">
          Go
        </PlayButton>
      </>,
    );
  });
  const button = container.querySelector("button");
  if (!button) throw new Error("PlayButton did not render");
  return { snapshot, button };
}

afterEach(async () => {
  errors.length = 0;
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("PlayButton when there is nothing to queue", () => {
  it("says so instead of doing nothing when the source has no songs", async () => {
    albumResult = async () => ({ list: "" });
    const { snapshot, button } = await mount();

    await act(async () => button.click());

    expect(snapshot.queue).toHaveLength(0);
    expect(errors).toEqual(["Nothing to play here yet."]);
  });

  it("says so, with no unhandled rejection, when the request fails", async () => {
    albumResult = async () => {
      throw new Error("upstream down");
    };
    const { snapshot, button } = await mount();

    await act(async () => button.click());

    expect(snapshot.queue).toHaveLength(0);
    expect(errors).toEqual(["Couldn't load songs"]);
  });
});
