import {
  cancelDownloads,
  downloadStore,
  endBatch,
  finishSong,
  setSongProgress,
  startBatch,
  startSong,
} from "./download-store";

const state = () => downloadStore.getState();

beforeEach(() => {
  const { batch } = state();
  if (batch) cancelDownloads();
  downloadStore.setState({ queued: {}, active: {}, batch: null });
});

describe("download store", () => {
  it("queues a batch, runs one song at a time and counts the outcomes", () => {
    const signal = startBatch(["a", "b", "c"], 3);
    expect(Object.keys(state().queued)).toEqual(["a", "b", "c"]);

    startSong("a", signal);
    expect(state().queued).toEqual({ b: true, c: true });
    expect(state().active).toEqual({ a: 0 });
    expect(state().batch?.current).toBe("a");

    setSongProgress("a", 0.5);
    expect(state().active.a).toBe(0.5);

    finishSong("a", "saved", signal);
    startSong("b", signal);
    finishSong("b", "failed", signal);
    expect(state().active).toEqual({});
    expect(state().batch).toMatchObject({
      saved: 1,
      failed: 1,
      total: 3,
      current: undefined,
    });

    endBatch(signal);
    expect(state()).toEqual({ queued: {}, active: {}, batch: null });
  });

  it("moves progress in steps, and a size that is unknown reads null", () => {
    startSong("a");
    setSongProgress("a", 0.01);
    expect(state().active.a).toBe(0);
    setSongProgress("a", 0.03);
    expect(state().active.a).toBe(0.03);
    setSongProgress("a", 1);
    expect(state().active.a).toBe(1);
    setSongProgress("a", null);
    expect(state().active.a).toBeNull();
  });

  it("ignores progress for a song that is not transferring", () => {
    setSongProgress("ghost", 0.5);
    expect(state().active).toEqual({});
  });

  it("tracks a single download without a batch", () => {
    startSong("solo");
    expect(state().batch).toBeNull();
    finishSong("solo", "saved");
    expect(state().active).toEqual({});
  });

  it("cancel aborts the signal and clears the waiting and active songs", () => {
    const signal = startBatch(["a", "b"], 2);
    startSong("a", signal);
    startSong("solo");

    cancelDownloads();

    expect(signal.aborted).toBe(true);
    // A single download of another song keeps going.
    expect(state()).toEqual({ queued: {}, active: { solo: 0 }, batch: null });
  });

  it("a cancelled run cannot touch the batch that follows it", () => {
    const old = startBatch(["a"], 1);
    cancelDownloads();
    const next = startBatch(["a"], 1);
    startSong("a", next);

    finishSong("a", "saved", old);
    endBatch(old);

    expect(state().active).toEqual({ a: 0 });
    expect(state().batch?.total).toBe(1);
  });

  it("cancel with no batch does nothing", () => {
    expect(() => cancelDownloads()).not.toThrow();
  });
});
