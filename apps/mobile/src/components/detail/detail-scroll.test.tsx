import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import {
  DetailScrollContext,
  SCROLLED_UNDER_OFFSET,
  useDetailScrollProps,
} from "./detail-scroll";

const scrollTo = (y: number) =>
  ({
    nativeEvent: { contentOffset: { x: 0, y } },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

describe("useDetailScrollProps", () => {
  it("is empty outside a DetailFrame", async () => {
    const { result } = await renderHook(() => useDetailScrollProps());
    expect(result.current).toEqual({});
  });

  it("reports scrolled only once past the header art's offset", async () => {
    const setScrolled = jest.fn();
    const offset = { set: jest.fn() } as unknown as SharedValue<number>;
    const { result } = await renderHook(() => useDetailScrollProps(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DetailScrollContext value={{ setScrolled, offset }}>
          {children}
        </DetailScrollContext>
      ),
    });

    expect(result.current.scrollEventThrottle).toBe(16);
    result.current.onScroll?.(scrollTo(0));
    result.current.onScroll?.(scrollTo(SCROLLED_UNDER_OFFSET));
    result.current.onScroll?.(scrollTo(SCROLLED_UNDER_OFFSET + 1));
    result.current.onScroll?.(scrollTo(-40));

    expect(setScrolled.mock.calls).toEqual([[false], [false], [true], [false]]);
    expect(jest.mocked(offset.set).mock.calls.at(-1)).toEqual([-40]);
  });
});
