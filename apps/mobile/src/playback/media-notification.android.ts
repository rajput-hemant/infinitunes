import { ensureNotificationPermission } from "~/lib/notifications";

/**
 * Android 13+ shows the media controls notification (expo-audio's foreground
 * service) only with the notification permission, so the first play asks for
 * it, once; a refusal is respected and playback is unaffected.
 */
export function requestMediaNotificationPermission() {
  void ensureNotificationPermission();
}
