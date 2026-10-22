import { act, renderHook } from "@testing-library/react-native";

import {
  playbackPosition,
  playbackStatusStore,
} from "~/playback/playback-status";

import { useProgressValues } from "./progress-values";

beforeEach(() => {
  playbackStatusStore.setState({ duration: 200, bufferedTime: 100 });
  playbackPosition.set(30);
});

describe("useProgressValues", () => {
  it("starts at the stores' fractions", async () => {
    const { result } = await renderHook(() => useProgressValues());

    expect(result.current.played.get()).toBe(0.15);
    expect(result.current.buffered.get()).toBe(0.5);
  });

  it("follows the playhead and the buffer without re-rendering", async () => {
    let renders = 0;
    const { result } = await renderHook(() => {
      renders += 1;
      return useProgressValues();
    });
    const before = renders;

    await act(async () => playbackPosition.set(100));
    await act(async () => playbackStatusStore.setState({ bufferedTime: 150 }));

    expect(result.current.played.get()).toBe(0.5);
    expect(result.current.buffered.get()).toBe(0.75);
    expect(renders).toBe(before);
  });

  it("clamps, and reads 0 before the duration is known", async () => {
    const { result } = await renderHook(() => useProgressValues());

    await act(async () => playbackPosition.set(250));
    expect(result.current.played.get()).toBe(1);

    await act(async () => playbackStatusStore.setState({ duration: 0 }));
    expect(result.current.played.get()).toBe(0);
    expect(result.current.buffered.get()).toBe(0);
  });

  it("lets a drag override the playhead", async () => {
    const { result, rerender } = await renderHook(
      ({ drag }: { drag: number | null }) => useProgressValues(drag),
      { initialProps: { drag: null as number | null } },
    );

    await rerender({ drag: 90 });
    await act(async () => playbackPosition.set(31));
    expect(result.current.played.get()).toBe(0.45);

    await rerender({ drag: null });
    expect(result.current.played.get()).toBe(31 / 200);
  });
});
