import { renderHook } from "@testing-library/react-native";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { sizes, space } from "~/theme/tokens";

import { FLOATING_DOCK_INSET, useFloatingDockOffset } from "./player-dock";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type PlayerDock = typeof import("./player-dock");

// The dock's geometry is decided at load: re-evaluate it per case.
const load = (hasTabBarAccessory: boolean, os: "ios" | "android" = "ios") => {
  let dock: PlayerDock | undefined;
  jest.isolateModules(() => {
    jest.doMock("~/lib/platform", () => ({ hasTabBarAccessory }));
    jest.doMock("react-native-safe-area-context", () => ({
      useSafeAreaInsets: () => metrics.insets,
    }));
    (require("react-native") as typeof import("react-native")).Platform.OS = os;
    dock = require("./player-dock") as PlayerDock;
  });
  return dock!;
};
const inset = (hasTabBarAccessory: boolean) =>
  load(hasTabBarAccessory).playerDockInset;

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

  it("fuses Android's strip to the navigation bar, edge to edge", () => {
    const android = load(false, "android");
    expect(android.FLOATING_DOCK_INSET).toBe(0);
    expect(android.playerDockInset).toBe(sizes.dock);
    // The isolated hook reads only the (mocked) insets, so it runs as a plain call.
    expect(android.useFloatingDockOffset()).toBe(34 + 80);
  });

  it("pads tab content by the dock only when there is no tab bar accessory", () => {
    expect(inset(false)).toBe(sizes.dock + space.sm);
    expect(inset(true)).toBe(0);
  });
});
