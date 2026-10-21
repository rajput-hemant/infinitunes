import { requestNotificationPermissionsAsync } from "expo-audio";

/**
 * Android 13+ shows the media controls notification (and keeps background
 * playback's foreground service visible) only with the notification
 * permission, so the first play asks for it.
 */
export function requestMediaNotificationPermission() {
  void requestNotificationPermissionsAsync();
}
