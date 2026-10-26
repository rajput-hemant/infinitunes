import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";

import { space } from "~/theme/tokens";

import { useSheetBottomInset } from "./sheet-inset";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 24 }),
}));

describe("useSheetBottomInset", () => {
  it("clears Android's navigation bar plus a gutter", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const { result } = await renderHook(() => useSheetBottomInset());

    expect(result.current).toBe(24 + space.lg);
  });

  it("adds nothing on iOS, whose sheets inset themselves", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { result } = await renderHook(() => useSheetBottomInset());

    expect(result.current).toBe(0);
  });
});
