import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { colors } from "~/theme/tokens";

import { useScrolledBar } from "./use-scrolled-bar";

const mockSetOptions = jest.fn();
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

const scrollTo = (y: number) =>
  ({
    nativeEvent: { contentOffset: { x: 0, y } },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

describe("useScrolledBar", () => {
  beforeEach(() => {
    mockSetOptions.mockClear();
  });

  it("tints the Android bar once content scrolls under it, and only on a change", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const { result } = await renderHook(() => useScrolledBar());

    result.current.onScroll?.(scrollTo(0));
    expect(mockSetOptions).not.toHaveBeenCalled();

    result.current.onScroll?.(scrollTo(12));
    result.current.onScroll?.(scrollTo(80));
    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    expect(mockSetOptions).toHaveBeenLastCalledWith({
      headerStyle: { backgroundColor: colors.light.card },
    });

    result.current.onScroll?.(scrollTo(0));
    expect(mockSetOptions).toHaveBeenCalledTimes(2);
    expect(mockSetOptions).toHaveBeenLastCalledWith({ headerStyle: undefined });
  });

  it("leaves iOS's glass bar alone", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { result } = await renderHook(() => useScrolledBar());

    expect(result.current).toEqual({});
  });
});
