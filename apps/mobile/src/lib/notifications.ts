import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { AppState, Platform } from "react-native";
import { createStore } from "zustand";
import { persist } from "zustand/middleware";

import { colors } from "~/theme/tokens";

import { persistedStorage } from "./persisted-storage";

/**
 * Local notifications only (no push: nothing here registers a token). The
 * downloads channel and the permission prompt live here, and so does the
 * playback notification's permission: on Android 13+ the media controls
 * (expo-audio's foreground service) need the same `POST_NOTIFICATIONS` grant.
 */

export const DOWNLOADS_CHANNEL_ID = "downloads";

/** The tint of the small icon (`app.config.ts` uses the same value). */
export const NOTIFICATION_ACCENT = colors.light.primary;

// The app shows its own toasts while it is in front, so a notification that
// arrives then stays out of the way (they are only posted in the background).
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

type PromptState = { asked: boolean };

/** Whether the system prompt was shown once; it is never shown a second time. */
export const notificationPromptStore = createStore<PromptState>()(
  persist<PromptState>(() => ({ asked: false }), {
    name: "notification-prompt",
    storage: persistedStorage<PromptState>(),
  }),
);

/** Android 13+ shows the permission prompt only once a channel exists. */
async function ensureDownloadsChannel() {
  if (Platform.OS !== "android") return;
  await setNotificationChannelAsync(DOWNLOADS_CHANNEL_ID, {
    name: "Downloads",
    importance: AndroidImportance.DEFAULT,
    sound: null,
    vibrationPattern: null,
    lightColor: NOTIFICATION_ACCENT,
  });
}

/**
 * Whether notifications may be posted. Asks the listener once, the first time
 * a feature needs it (first download, first playback on Android 13+), and
 * never again after a refusal, so a denial is respected silently.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await ensureDownloadsChannel();
    const current = await getPermissionsAsync();
    if (current.granted) return true;
    const { asked } = notificationPromptStore.getState();
    if (asked || !current.canAskAgain) return false;
    notificationPromptStore.setState({ asked: true });
    return (await requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function post(title: string, body: string, kind: string) {
  // In front, the toast already says it.
  if (AppState.currentState === "active") return;
  try {
    // Never prompts here: the permission was asked when the download began.
    if (!(await getPermissionsAsync()).granted) return;
    await scheduleNotificationAsync({
      content: { title, body, data: { kind }, color: NOTIFICATION_ACCENT },
      trigger:
        Platform.OS === "android" ? { channelId: DOWNLOADS_CHANNEL_ID } : null,
    });
  } catch {
    // A notification is a courtesy; it never fails a download.
  }
}

/** "Download all" finished while the app was in the background. */
export function notifyDownloadsFinished(
  { saved, failed }: { saved: number; failed: number },
  total: number,
) {
  if (saved === 0) {
    return post("Download failed", "No songs could be saved.", "downloads");
  }
  return post(
    failed === 0 ? "Download complete" : "Download finished",
    failed === 0
      ? `${total} ${total === 1 ? "song" : "songs"} saved.`
      : `${saved} of ${total} songs saved, ${failed} failed.`,
    "downloads",
  );
}

/** A single download failed while the app was in the background. */
export function notifyDownloadFailed(name: string) {
  return post(
    "Download failed",
    `"${name}" couldn't be downloaded.`,
    "download",
  );
}
