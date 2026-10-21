import { act, renderHook } from "@testing-library/react-native";

import { deferred } from "~/test/user-library";

import { usePending } from "./use-pending";

describe("usePending", () => {
  it("is pending while the task runs and clears when it settles", async () => {
    const task = deferred<void>();
    const { result } = await renderHook(() => usePending());
    expect(result.current.pending).toBe(false);

    let settled: Promise<void> = Promise.resolve();
    await act(async () => {
      settled = result.current.run(() => task.promise);
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      task.resolve();
      await settled;
    });
    expect(result.current.pending).toBe(false);
  });

  it("ignores a second run while one is in flight, so a double tap submits once", async () => {
    const task = deferred<void>();
    const work = jest.fn(() => task.promise);
    const { result } = await renderHook(() => usePending());

    await act(async () => {
      void result.current.run(work);
      await result.current.run(work);
    });
    expect(work).toHaveBeenCalledTimes(1);

    await act(async () => task.resolve());
    await act(async () => {
      await result.current.run(async () => {});
    });
    // Free again after it settled.
    const again = jest.fn(async () => {});
    await act(async () => {
      await result.current.run(again);
    });
    expect(again).toHaveBeenCalledTimes(1);
  });

  it("clears pending after a task that rejects, and lets the next one run", async () => {
    const { result } = await renderHook(() => usePending());

    await act(async () => {
      await result.current
        .run(() => Promise.reject(new Error("nope")))
        .catch(() => {});
    });
    expect(result.current.pending).toBe(false);

    const next = jest.fn(async () => {});
    await act(async () => {
      await result.current.run(next);
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
