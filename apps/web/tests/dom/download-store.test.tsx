import { describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { RowDownload } from "../../components/song-list/row-download";
import type { DownloadJob } from "../../lib/download-store";
import { cancelBatch, enqueueDownloads } from "../../lib/download-store";

type Probe = {
  job: DownloadJob;
  /** Resolves when the queue starts the job. */
  started: Promise<void>;
  runs: () => number;
  aborted: () => boolean;
  progress: (fraction: number | null) => void;
  finish: () => void;
  fail: () => void;
};

/** A job that runs until the test finishes, fails or cancels it. */
function probe(id: string): Probe {
  let runs = 0;
  let aborted = false;
  let report: (fraction: number | null) => void = () => {};
  let finish: () => void = () => {};
  let fail: () => void = () => {};
  let markStarted: () => void = () => {};
  const started = new Promise<void>((resolve) => (markStarted = resolve));

  return {
    started,
    runs: () => runs,
    aborted: () => aborted,
    progress: (fraction) => report(fraction),
    finish: () => finish(),
    fail: () => fail(),
    job: {
      id,
      run: ({ signal, progress }) =>
        new Promise<void>((resolve, reject) => {
          runs++;
          report = progress;
          finish = resolve;
          fail = () => reject(new Error("boom"));
          signal.addEventListener("abort", () => {
            aborted = true;
            reject(new DOMException("cancelled", "AbortError"));
          });
          markStarted();
        }),
    },
  };
}

const tick = () => act(async () => new Promise((r) => setTimeout(r, 0)));

async function mountRows(ids: string[]) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <>
        {ids.map((id) => (
          <div key={id} data-row={id}>
            <RowDownload id={id} name={`Song ${id}`} />
          </div>
        ))}
      </>,
    );
  });
  const row = (id: string) => container.querySelector(`[data-row="${id}"]`)!;
  return {
    ring: (id: string) => row(id).querySelector('[role="progressbar"]'),
    dot: (id: string) => row(id).querySelector(".sr-only"),
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("download store", () => {
  it("runs one song at a time and each row shows only its own state", async () => {
    const [a, b, c] = [probe("a"), probe("b"), probe("c")] as [
      Probe,
      Probe,
      Probe,
    ];
    const rows = await mountRows(["a", "b", "c", "idle"]);

    let queued: ReturnType<typeof enqueueDownloads>;
    await act(async () => {
      queued = enqueueDownloads([a.job, b.job, c.job]);
    });
    await a.started;

    // The current song has the ring, the others wait as dots, the rest show nothing.
    expect(rows.ring("a")?.getAttribute("aria-label")).toBe(
      "Downloading Song a",
    );
    expect(rows.dot("b")?.textContent).toBe("Song b is waiting to download");
    expect(rows.dot("c")).not.toBeNull();
    expect(rows.ring("b")).toBeNull();
    expect(rows.ring("idle")).toBeNull();
    expect(rows.dot("idle")).toBeNull();
    expect([a.runs(), b.runs(), c.runs()]).toEqual([1, 0, 0]);

    await act(async () => a.finish());
    await b.started;
    expect(rows.ring("a")).toBeNull();
    expect(rows.dot("a")).toBeNull();
    expect(rows.ring("b")).not.toBeNull();
    expect(rows.dot("c")).not.toBeNull();
    expect(c.runs()).toBe(0);

    await act(async () => b.finish());
    await c.started;
    await act(async () => c.finish());

    expect(await queued!.done).toEqual({
      total: 3,
      failed: 0,
      cancelled: false,
    });
    expect(rows.ring("c")).toBeNull();
    await rows.unmount();
  });

  it("moves the current row's ring with the byte progress", async () => {
    const a = probe("a");
    const rows = await mountRows(["a"]);
    let queued: ReturnType<typeof enqueueDownloads>;
    await act(async () => {
      queued = enqueueDownloads([a.job]);
    });
    await a.started;

    // Size unknown: no value, the ring spins (a static arc under reduced motion).
    expect(rows.ring("a")?.hasAttribute("aria-valuenow")).toBe(false);

    await act(async () => a.progress(0.4));
    expect(rows.ring("a")?.getAttribute("aria-valuenow")).toBe("40");
    await act(async () => a.progress(1));
    expect(rows.ring("a")?.getAttribute("aria-valuenow")).toBe("100");

    await act(async () => a.finish());
    await queued!.done;
    await rows.unmount();
  });

  it("counts a failed song and carries on with the rest", async () => {
    const [a, b] = [probe("a"), probe("b")] as [Probe, Probe];
    const originalError = console.error;
    console.error = () => {};
    try {
      const queued = enqueueDownloads([a.job, b.job])!;
      await a.started;
      a.fail();
      await b.started;
      b.finish();
      expect(await queued.done).toEqual({
        total: 2,
        failed: 1,
        cancelled: false,
      });
    } finally {
      console.error = originalError;
    }
  });

  it("cancel aborts the running song and never starts the rest", async () => {
    const [a, b, c] = [probe("a"), probe("b"), probe("c")] as [
      Probe,
      Probe,
      Probe,
    ];
    const rows = await mountRows(["a", "b", "c"]);
    let queued: ReturnType<typeof enqueueDownloads>;
    await act(async () => {
      queued = enqueueDownloads([a.job, b.job, c.job]);
    });
    await a.started;

    await act(async () => cancelBatch(queued!.batch));

    expect(await queued!.done).toEqual({
      total: 3,
      failed: 0,
      cancelled: true,
    });
    await tick();
    expect(a.aborted()).toBe(true);
    expect([b.runs(), c.runs()]).toEqual([0, 0]);
    expect(rows.ring("a")).toBeNull();
    expect(rows.dot("b")).toBeNull();
    expect(rows.dot("c")).toBeNull();
    await rows.unmount();
  });

  it("cancelling one batch leaves a later one queued", async () => {
    const [a, b] = [probe("a"), probe("b")] as [Probe, Probe];
    const first = enqueueDownloads([a.job])!;
    const second = enqueueDownloads([b.job])!;
    await a.started;

    cancelBatch(first.batch);
    expect((await first.done).cancelled).toBe(true);
    await b.started;
    expect(b.aborted()).toBe(false);

    b.finish();
    expect(await second.done).toEqual({
      total: 1,
      failed: 0,
      cancelled: false,
    });
  });

  it("does not queue a song that is already queued or running", async () => {
    const a = probe("a");
    const queued = enqueueDownloads([a.job])!;
    await a.started;

    expect(enqueueDownloads([probe("a").job])).toBeNull();

    a.finish();
    await queued.done;
  });
});
