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

import { persistedStorage } from "./persisted-storage";

/**
 * Local notifications only (no push: nothing here registers a token). The
 * downloads channel and the permission prompt live here. The playback
 * notification is not part of it: Android 13+ exempts media-session
 * notifications (expo-audio's Media3 service) from `POST_NOTIFICATIONS`, so
 * playing never asks; the first download does.
 */

export const DOWNLOADS_CHANNEL_ID = "downloads";

/**
 * The brand teal of the app icon's ribbon gradient (`assets/brand/glyph.svg`,
 * its bottom stop). Legible on both light and dark notification shades, unlike
 * the near-black `primary`. `app.config.ts` repeats the value (that file runs
 * in Node and cannot load this module): keep them equal.
 */
const brand = "#067f9a";

/** The tint of the small icon and the channel light. */
export const NOTIFICATION_ACCENT = brand;

// A notification that arrives while the app is in front stays out of the way
// (they are only posted in the background).
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

/**
 * Apps targeting API 32 or lower get Android 13's permission prompt only once
 * a channel exists, so the channel is created before asking (harmless above).
 */
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

let promptInFlight: Promise<boolean> | undefined;

/** Shows the system prompt; `asked` is set only once it has resolved. */
async function askOnce(): Promise<boolean> {
  const { granted } = await requestPermissionsAsync();
  notificationPromptStore.setState({ asked: true });
  return granted;
}

/**
 * Whether notifications may be posted. Asks the listener once, the first time
 * a feature needs it (the first download), and never again after a refusal,
 * so a denial is respected silently. A prompt that throws does not count as
 * asked; concurrent callers share one prompt.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await ensureDownloadsChannel();
    const current = await getPermissionsAsync();
    if (current.granted) return true;
    if (notificationPromptStore.getState().asked || !current.canAskAgain) {
      return false;
    }
    promptInFlight ??= askOnce().finally(() => {
      promptInFlight = undefined;
    });
    return await promptInFlight;
  } catch {
    return false;
  }
}

async function post(title: string, body: string, kind: string) {
  // Posted only in the background.
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
