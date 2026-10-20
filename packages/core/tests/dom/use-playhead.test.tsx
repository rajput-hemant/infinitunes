import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { createPositionStore } from "../../src/react/position-store";
import type { PositionStore } from "../../src/react/position-store";
import { usePlayhead } from "../../src/react/use-playhead";

type HarnessProps = {
  store: PositionStore;
  read: () => number;
  playing: boolean;
  frozen?: boolean;
};

function Harness({ store, read, playing, frozen }: HarnessProps) {
  usePlayhead({
    store,
    getPosition: read,
    playing,
    frozen,
    tickMs: 20,
  });
  return null;
}

let root: Root | undefined;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mount(props: HarnessProps) {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root?.render(<Harness {...props} />));
  return (next: HarnessProps) =>
    act(async () => root?.render(<Harness {...next} />));
}

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe("usePlayhead", () => {
  it("publishes each new position on a slow tick while playing, not on every frame", async () => {
    const store = createPositionStore();
    let clock = 0;
    const read = () => ++clock;
    let notified = 0;
    store.subscribe(() => notified++);

    await mount({ store, read, playing: true });
    await wait(400);

    // 400ms at 20ms is about 20 ticks; a 60Hz frame loop would be about 24+,
    // and an unthrottled one far more. The point: bounded by the tick, not
    // by how often the page paints.
    expect(notified).toBeGreaterThan(5);
    expect(notified).toBeLessThanOrEqual(25);
    expect(store.get()).toBe(clock);
  });

  it("reads once and then goes quiet while paused", async () => {
    const store = createPositionStore();
    let reads = 0;
    const read = () => {
      reads++;
      return 12;
    };

    await mount({ store, read, playing: false });
    await wait(200);

    expect(reads).toBe(1);
    expect(store.get()).toBe(12);
  });

  it("stops ticking when playback pauses and resumes when it plays again", async () => {
    const store = createPositionStore();
    let reads = 0;
    const read = () => ++reads;
    const rerender = await mount({ store, read, playing: true });
    await wait(150);
    await rerender({ store, read, playing: false });
    const atPause = reads;
    await wait(150);
    expect(reads).toBe(atPause);
    await rerender({ store, read, playing: true });
    await wait(100);
    expect(reads).toBeGreaterThan(atPause);
  });

  it("leaves the store alone while the seek bar is being dragged", async () => {
    const store = createPositionStore(5);
    let reads = 0;
    const read = () => ++reads;
    await mount({ store, read, playing: true, frozen: true });
    await wait(150);
    expect(reads).toBe(0);
    expect(store.get()).toBe(5);
  });
});
