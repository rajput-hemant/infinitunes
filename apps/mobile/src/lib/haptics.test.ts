import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import * as haptics from "./haptics";

const mocked = jest.mocked(Haptics);
const original = Platform.OS;
afterEach(() => {
  Platform.OS = original;
  jest.clearAllMocks();
});

describe("iOS", () => {
  beforeEach(() => {
    Platform.OS = "ios";
  });
  it("maps intents to feedback generators", () => {
    haptics.tap();
    expect(mocked.impactAsync).toHaveBeenLastCalledWith("light");
    haptics.selection();
    expect(mocked.selectionAsync).toHaveBeenCalled();
    haptics.confirm();
    expect(mocked.notificationAsync).toHaveBeenLastCalledWith("success");
    haptics.reject();
    expect(mocked.notificationAsync).toHaveBeenLastCalledWith("error");
    haptics.toggle(true);
    expect(mocked.impactAsync).toHaveBeenLastCalledWith("medium");
    haptics.commit();
    expect(mocked.impactAsync).toHaveBeenLastCalledWith("rigid");
    expect(mocked.performAndroidHapticsAsync).not.toHaveBeenCalled();
  });
});

describe("Android", () => {
  beforeEach(() => {
    Platform.OS = "android";
  });
  it("maps intents to haptic constants", () => {
    const expected: [() => void, string][] = [
      [haptics.tap, "virtual-key"],
      [haptics.selection, "segment-tick"],
      [() => haptics.toggle(true), "toggle-on"],
      [() => haptics.toggle(false), "toggle-off"],
      [haptics.confirm, "confirm"],
      [haptics.reject, "reject"],
      [haptics.longPress, "long-press"],
      [haptics.dragStart, "gesture-start"],
    ];
    for (const [fire, constant] of expected) {
      fire();
      expect(mocked.performAndroidHapticsAsync).toHaveBeenLastCalledWith(
        constant,
      );
    }
    expect(mocked.impactAsync).not.toHaveBeenCalled();
  });
  it("never throws", () => {
    mocked.performAndroidHapticsAsync.mockImplementationOnce(() => {
      throw new Error("no engine");
    });
    expect(() => haptics.tap()).not.toThrow();
    mocked.performAndroidHapticsAsync.mockRejectedValueOnce(new Error("x"));
    expect(() => haptics.tap()).not.toThrow();
  });
});
