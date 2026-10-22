import {
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { AppState, Platform } from "react-native";

import {
  DOWNLOADS_CHANNEL_ID,
  NOTIFICATION_ACCENT,
  ensureNotificationPermission,
  notificationPromptStore,
  notifyDownloadFailed,
  notifyDownloadsFinished,
} from "./notifications";

const permissions = jest.mocked(getPermissionsAsync);
const request = jest.mocked(requestPermissionsAsync);
const schedule = jest.mocked(scheduleNotificationAsync);

function permissionIs(granted: boolean, canAskAgain = true) {
  permissions.mockResolvedValue({ granted, canAskAgain } as never);
}

function appIs(state: "active" | "background") {
  // The Jest AppState stand-in has a function here; the app reads a string.
  Object.assign(AppState, { currentState: state });
}

beforeEach(() => {
  notificationPromptStore.setState({ asked: false });
  appIs("background");
  permissionIs(true);
});

afterEach(() => jest.restoreAllMocks());

describe("ensureNotificationPermission", () => {
  it("does not prompt when already granted", async () => {
    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it("asks once, then respects a refusal without asking again", async () => {
    permissionIs(false);
    request.mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
    } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(false);
    await expect(ensureNotificationPermission()).resolves.toBe(false);
    await expect(ensureNotificationPermission()).resolves.toBe(false);

    expect(request).toHaveBeenCalledTimes(1);
    expect(notificationPromptStore.getState().asked).toBe(true);
  });

  it("does not burn the only prompt when the request throws", async () => {
    permissionIs(false);
    request.mockRejectedValueOnce(new Error("no activity"));

    await expect(ensureNotificationPermission()).resolves.toBe(false);
    expect(notificationPromptStore.getState().asked).toBe(false);

    request.mockResolvedValueOnce({
      granted: true,
      canAskAgain: true,
    } as never);
    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("shows one prompt to concurrent callers", async () => {
    permissionIs(false);
    request.mockResolvedValue({ granted: true, canAskAgain: true } as never);

    const results = await Promise.all([
      ensureNotificationPermission(),
      ensureNotificationPermission(),
    ]);

    expect(results).toEqual([true, true]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("never prompts where the system will not show it", async () => {
    permissionIs(false, false);

    await expect(ensureNotificationPermission()).resolves.toBe(false);

    expect(request).not.toHaveBeenCalled();
  });

  it("is silent when the native side throws", async () => {
    permissions.mockRejectedValueOnce(new Error("no module"));

    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });

  it("creates the Downloads channel before asking on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    permissionIs(false);
    const order: string[] = [];
    jest
      .mocked(setNotificationChannelAsync)
      .mockImplementationOnce(async () => void order.push("channel") as never);
    request.mockImplementationOnce(async () => {
      order.push("request");
      return { granted: true, canAskAgain: true } as never;
    });

    await expect(ensureNotificationPermission()).resolves.toBe(true);

    expect(order).toEqual(["channel", "request"]);
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      DOWNLOADS_CHANNEL_ID,
      expect.objectContaining({ name: "Downloads" }),
    );
  });
});

describe("download notifications", () => {
  it("posts the result of download all on the Downloads channel (Android)", async () => {
    jest.replaceProperty(Platform, "OS", "android");

    await notifyDownloadsFinished({ saved: 3, failed: 0 }, 3);

    expect(schedule).toHaveBeenCalledWith({
      content: {
        title: "Download complete",
        body: "3 songs saved.",
        data: { kind: "downloads" },
        color: NOTIFICATION_ACCENT,
      },
      trigger: { channelId: DOWNLOADS_CHANNEL_ID },
    });
  });

  it("reports partial and total failure", async () => {
    await notifyDownloadsFinished({ saved: 2, failed: 1 }, 3);
    await notifyDownloadsFinished({ saved: 0, failed: 3 }, 3);

    expect(schedule.mock.calls.map(([posted]) => posted.content.body)).toEqual([
      "2 of 3 songs saved, 1 failed.",
      "No songs could be saved.",
    ]);
  });

  it("posts a single failed download immediately (iOS)", async () => {
    await notifyDownloadFailed("Tum Hi Ho");

    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: "Download failed",
          body: '"Tum Hi Ho" couldn\'t be downloaded.',
        }),
        trigger: null,
      }),
    );
  });

  it("stays silent while the app is in front", async () => {
    appIs("active");

    await notifyDownloadsFinished({ saved: 1, failed: 0 }, 1);

    expect(schedule).not.toHaveBeenCalled();
  });

  it("stays silent without the permission, and never prompts for it", async () => {
    permissionIs(false);

    await notifyDownloadFailed("Tum Hi Ho");

    expect(schedule).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it("never rejects when scheduling fails", async () => {
    schedule.mockRejectedValueOnce(new Error("boom"));

    await expect(notifyDownloadFailed("x")).resolves.toBeUndefined();
  });
});
