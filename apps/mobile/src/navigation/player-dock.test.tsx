import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { sizes, space } from "~/theme/tokens";

import { FLOATING_DOCK_INSET, useFloatingDockOffset } from "./player-dock";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe("player dock", () => {
  afterEach(() => jest.restoreAllMocks());

  it("insets the floating dock by the page gutter", () => {
    expect(FLOATING_DOCK_INSET).toBe(sizes.page);
  });

  it("sits above the home indicator, the tab bar and a gap", async () => {
    const { result } = await renderHook(() => useFloatingDockOffset(), {
      wrapper: ({ children }) => (
        <SafeAreaProvider initialMetrics={metrics}>{children}</SafeAreaProvider>
      ),
    });
    const tabBar = Platform.select({ ios: 49, default: 80 });
    expect(result.current).toBe(34 + tabBar + space.sm);
  });

  it("pads tab content by the dock only when there is no tab bar accessory", () => {
    // `playerDockInset` is decided at load: re-evaluate it per case.
    const inset = (hasTabBarAccessory: boolean) => {
      let value = -1;
      jest.isolateModules(() => {
        jest.doMock("~/lib/platform", () => ({ hasTabBarAccessory }));
        value = (require("./player-dock") as typeof import("./player-dock"))
          .playerDockInset;
      });
      return value;
    };
    expect(inset(false)).toBe(sizes.dock + space.sm);
    expect(inset(true)).toBe(0);
  });
});
