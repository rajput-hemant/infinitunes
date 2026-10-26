import {
  impactAsync,
  performAndroidHapticsAsync,
  selectionAsync,
} from "expo-haptics";
import { Platform } from "react-native";

import { playerHaptics } from "./haptics";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  performAndroidHapticsAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
  AndroidHaptics: {
    Virtual_Key: "virtual-key",
    Segment_Tick: "segment-tick",
    Clock_Tick: "clock-tick",
  },
}));

beforeEach(() => jest.clearAllMocks());

describe("playerHaptics", () => {
  it("uses the iOS feedback generators on iOS", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    playerHaptics.press();
    playerHaptics.tick();
    expect(impactAsync).toHaveBeenCalledWith("light");
    expect(selectionAsync).toHaveBeenCalled();
    expect(performAndroidHapticsAsync).not.toHaveBeenCalled();
  });

  it("uses Android's haptic constants on Android", () => {
    jest.replaceProperty(Platform, "OS", "android");
    playerHaptics.press();
    playerHaptics.tick();
    playerHaptics.release();
    expect(jest.mocked(performAndroidHapticsAsync).mock.calls).toEqual([
      ["virtual-key"],
      ["segment-tick"],
      ["clock-tick"],
    ]);
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it("stays quiet where haptics are unavailable", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    jest
      .mocked(impactAsync)
      .mockRejectedValueOnce(new Error("UnavailabilityError"));
    expect(() => playerHaptics.press()).not.toThrow();
    // The rejection is handled: no unhandled promise rejection follows.
    await Promise.resolve();
  });
});
