import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-notifications";

import { notificationPromptStore } from "~/lib/notifications";

import { requestMediaNotificationPermission as onIos } from "./media-notification";
import { requestMediaNotificationPermission as onAndroid } from "./media-notification.android";

beforeEach(() => notificationPromptStore.setState({ asked: false }));

describe("media notification permission", () => {
  it("asks on Android 13+ at first playback, and only once after a refusal", async () => {
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: false, canAskAgain: true } as never);
    jest
      .mocked(requestPermissionsAsync)
      .mockResolvedValue({ granted: false, canAskAgain: true } as never);

    onAndroid();
    await new Promise((resolve) => setImmediate(resolve));
    onAndroid();
    await new Promise((resolve) => setImmediate(resolve));

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("asks nothing on iOS, where Now Playing needs no permission", () => {
    onIos();

    expect(getPermissionsAsync).not.toHaveBeenCalled();
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
