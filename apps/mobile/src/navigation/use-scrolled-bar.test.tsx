import { renderHook, screen } from "@testing-library/react-native";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import { renderWithProviders } from "~/test/render";

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
  afterEach(() => jest.restoreAllMocks());

  it("installs Android's bar scrim once and never touches the navigator on scroll", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const { result } = await renderHook(() => useScrolledBar());

    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    result.current.onScroll?.(scrollTo(12));
    result.current.onScroll?.(scrollTo(80));
    result.current.onScroll?.(scrollTo(0));
    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    const [{ headerBackground }] = mockSetOptions.mock.calls[0] as [
      { headerBackground: () => React.ReactNode },
    ];
    await renderWithProviders(<>{headerBackground()}</>);
    expect(screen.getByTestId("bar-scrim")).toBeTruthy();
  });

  it("leaves iOS's glass bar alone", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { result } = await renderHook(() => useScrolledBar());

    expect(result.current).toEqual({});
    expect(mockSetOptions).not.toHaveBeenCalled();
  });
});
