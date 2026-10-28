import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

/** A "Download all" run: the songs it was asked for and how far it got. */
type Batch = {
  /** Every song of the run, so a header can tell whether the run is its own. */
  ids: Record<string, true>;
  total: number;
  saved: number;
  failed: number;
  /** The song transferring now. */
  current?: string;
};

type DownloadState = {
  /** Songs of the running batch still waiting their turn. */
  queued: Record<string, true>;
  /**
   * Songs transferring now (a batch's current one, or a single download):
   * the fraction done, `null` while the server has not said how big it is.
   */
  active: Record<string, number | null>;
  batch: Batch | null;
};

/** Progress moves in steps this big: a row re-renders at most 50 times a song. */
const PROGRESS_STEP = 0.02;

/** In memory only: a download does not outlive the app. */
export const downloadStore = createStore<DownloadState>()(() => ({
  queued: {},
  active: {},
  batch: null,
}));

let controller: AbortController | undefined;

/**
 * Begins a batch of `total` songs (`ids` are those with an id to show) and
 * returns the signal that `cancelDownloads` aborts. Every later call of the
 * run passes it back, so a run that was cancelled cannot touch its successor.
 */
export function startBatch(ids: readonly string[], total: number): AbortSignal {
  controller = new AbortController();
  const queued: Record<string, true> = {};
  for (const id of ids) queued[id] = true;
  downloadStore.setState({
    queued,
    batch: { ids: { ...queued }, total, saved: 0, failed: 0 },
  });
  return controller.signal;
}

/** A song starts transferring; leave `id` out for one that has no row to mark. */
export function startSong(id: string | undefined, signal?: AbortSignal) {
  if (id === undefined || signal?.aborted) return;
  downloadStore.setState(({ queued, active, batch }) => {
    const { [id]: _, ...rest } = queued;
    return {
      queued: rest,
      active: { ...active, [id]: 0 },
      batch: batch?.ids[id] ? { ...batch, current: id } : batch,
    };
  });
}

export function setSongProgress(id: string, fraction: number | null) {
  const before = downloadStore.getState().active[id];
  if (before === undefined) return;
  const moved =
    before === null || fraction === null
      ? before !== fraction
      : fraction === 1 || Math.abs(fraction - before) >= PROGRESS_STEP;
  if (!moved) return;
  downloadStore.setState(({ active }) => ({
    active: { ...active, [id]: fraction },
  }));
}

/** A song is done: `saved`, or `failed` (counted in a batch). */
export function finishSong(
  id: string | undefined,
  outcome: "saved" | "failed",
  signal?: AbortSignal,
) {
  if (id === undefined || signal?.aborted) return;
  downloadStore.setState(({ active, batch }) => {
    const { [id]: _, ...rest } = active;
    return {
      active: rest,
      batch: batch?.ids[id]
        ? {
            ...batch,
            [outcome]: batch[outcome] + 1,
            current: batch.current === id ? undefined : batch.current,
          }
        : batch,
    };
  });
}

/** The batch is over, whatever its outcome. */
export function endBatch(signal: AbortSignal) {
  if (signal.aborted) return;
  controller = undefined;
  downloadStore.setState({ queued: {}, batch: null });
}

/**
 * Stops the running batch: the song transferring is aborted and the waiting
 * ones never start. The marks clear at once.
 */
export function cancelDownloads() {
  const { batch, active } = downloadStore.getState();
  if (!batch) return;
  controller?.abort();
  controller = undefined;
  const remaining = { ...active };
  for (const id of Object.keys(batch.ids)) delete remaining[id];
  downloadStore.setState({ queued: {}, active: remaining, batch: null });
}

/** What a row shows for `id`: `undefined` when it is not downloading. */
export function useSongDownload(id: string): "active" | "queued" | undefined {
  return useStore(downloadStore, ({ active, queued }) =>
    active[id] !== undefined ? "active" : queued[id] ? "queued" : undefined,
  );
}

/** The fraction of `id` done, `null` while its size is unknown. */
export function useSongProgress(id: string): number | null {
  return useStore(downloadStore, ({ active }) => active[id] ?? null);
}

/** The running batch when `id` is one of its songs, else `null`. */
export function useBatchOf(id: string | undefined): Batch | null {
  return useStore(downloadStore, ({ batch }) =>
    id !== undefined && batch?.ids[id] ? batch : null,
  );
}
