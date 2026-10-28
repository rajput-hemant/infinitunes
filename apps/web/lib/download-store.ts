import { useSyncExternalStore } from "react";

/**
 * The download queue, one song at a time. Rows and the header button read it
 * through per-id / per-batch selectors, so only the controls of the song that
 * moved re-render. It holds no audio and imports nothing heavy: rows pull it
 * into the first-load graph. The fetching itself is the caller's `run`.
 */

export type DownloadJob = {
  /** The song's id: what its row looks up. A song already queued is not queued twice. */
  id: string;
  /** Fetches and saves one song. `progress` takes 0..1, or `null` when the size is unknown. */
  run: (context: {
    signal: AbortSignal;
    progress: (fraction: number | null) => void;
  }) => Promise<void>;
};

export type DownloadSummary = {
  total: number;
  failed: number;
  cancelled: boolean;
};

export type DownloadState = {
  /** Queued song ids, in order (the current one is not among them). */
  pending: readonly string[];
  currentId: string | null;
  currentBatch: number | null;
  /** The current song's fraction, `null` while its size is unknown. */
  progress: number | null;
  batches: ReadonlyMap<number, { total: number; done: number }>;
};

type Entry = DownloadJob & { batch: number };

type Batch = {
  total: number;
  /** Songs finished, failed ones included. */
  done: number;
  failed: number;
  cancelled: boolean;
  /** Songs queued or running. The batch ends at zero. */
  remaining: number;
  resolve: (summary: DownloadSummary) => void;
};

const IDLE: DownloadState = {
  pending: [],
  currentId: null,
  currentBatch: null,
  progress: null,
  batches: new Map(),
};

let state = IDLE;
let queue: Entry[] = [];
let current: Entry | null = null;
let progress: number | null = null;
let controller: AbortController | null = null;
let draining = false;
let nextBatch = 1;
const batches = new Map<number, Batch>();
const listeners = new Set<() => void>();

function publish() {
  state = {
    pending: queue.map((entry) => entry.id),
    currentId: current?.id ?? null,
    currentBatch: current?.batch ?? null,
    progress,
    batches: new Map(
      [...batches].map(([id, { total, done }]) => [id, { total, done }]),
    ),
  };
  for (const listener of listeners) listener();
}

function settle(id: number) {
  const batch = batches.get(id);
  if (!batch || batch.remaining > 0) return;
  batches.delete(id);
  publish();
  batch.resolve({
    total: batch.total,
    failed: batch.failed,
    cancelled: batch.cancelled,
  });
}

function setProgress(fraction: number | null) {
  // Whole percents: a chunk never re-renders more than the ring can show.
  const next = fraction === null ? null : Math.round(fraction * 100) / 100;
  if (next === progress) return;
  progress = next;
  publish();
}

async function drain() {
  if (draining) return;
  draining = true;
  for (let entry = queue.shift(); entry; entry = queue.shift()) {
    const batch = batches.get(entry.batch);
    if (!batch) continue;
    current = entry;
    progress = null;
    controller = new AbortController();
    const { signal } = controller;
    publish();

    try {
      await entry.run({ signal, progress: setProgress });
    } catch (error) {
      if (!signal.aborted) {
        console.error(error);
        batch.failed++;
      }
    }

    batch.done++;
    batch.remaining--;
    current = null;
    controller = null;
    publish();
    settle(entry.batch);
  }
  draining = false;
}

/**
 * Queues the songs as one batch. `done` resolves when every one of them has
 * been saved, failed or cancelled. `null` when all of them are already queued.
 */
export function enqueueDownloads(jobs: DownloadJob[]) {
  const taken = new Set(queue.map((entry) => entry.id));
  if (current) taken.add(current.id);
  const fresh = jobs.filter((job) => {
    if (taken.has(job.id)) return false;
    taken.add(job.id);
    return true;
  });
  if (fresh.length === 0) return null;

  const batch = nextBatch++;
  const done = new Promise<DownloadSummary>((resolve) => {
    batches.set(batch, {
      total: fresh.length,
      done: 0,
      failed: 0,
      cancelled: false,
      remaining: fresh.length,
      resolve,
    });
  });
  queue.push(...fresh.map((job) => ({ ...job, batch })));
  publish();
  void drain();
  return { batch, done };
}

/** Drops the batch's queued songs and aborts its running one; what was saved stays saved. */
export function cancelBatch(id: number) {
  const batch = batches.get(id);
  if (!batch) return;
  batch.cancelled = true;
  const kept = queue.filter((entry) => entry.batch !== id);
  batch.remaining -= queue.length - kept.length;
  queue = kept;
  if (current?.batch === id) controller?.abort();
  publish();
  settle(id);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `select` must return a primitive: it runs on every store change. */
export function useDownloads<T extends string | number | boolean | null>(
  select: (state: DownloadState) => T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(IDLE),
  );
}

export type DownloadStatus = "idle" | "queued" | "active";

export function useDownloadStatus(id: string): DownloadStatus {
  return useDownloads((s) =>
    s.currentId === id
      ? "active"
      : s.pending.includes(id)
        ? "queued"
        : "idle",
  );
}

/** The song's fraction while it is the current one; `null` when unknown or not current. */
export function useDownloadProgress(id: string) {
  return useDownloads((s) => (s.currentId === id ? s.progress : null));
}

export function useBatchTotal(batch: number | null) {
  return useDownloads((s) =>
    batch === null ? 0 : (s.batches.get(batch)?.total ?? 0),
  );
}

export function useBatchDone(batch: number | null) {
  return useDownloads((s) =>
    batch === null ? 0 : (s.batches.get(batch)?.done ?? 0),
  );
}

/** The batch's overall fraction: finished songs plus the running one's share. */
export function useBatchFraction(batch: number | null) {
  return useDownloads((s) => {
    const entry = batch === null ? undefined : s.batches.get(batch);
    if (!entry) return 0;
    const running = s.currentBatch === batch ? (s.progress ?? 0) : 0;
    return Math.min(1, (entry.done + running) / entry.total);
  });
}
