import {
  AndroidHaptics,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
  performAndroidHapticsAsync,
  selectionAsync,
} from "expo-haptics";
import { Platform } from "react-native";

/**
 * The only way the app fires haptics: named by intent, mapped per platform
 * (iOS feedback generators, Android `HapticFeedbackConstants`). Fire and
 * forget, never throws. The OS's own switches govern them: iOS "System
 * Haptics" and Android's touch feedback setting silence these calls.
 * Native controls (UISwitch, UISegmentedControl, native tabs, menus) already
 * tick on iOS: do not add these there.
 */
function fire(ios: () => Promise<void>, android: AndroidHaptics) {
  try {
    const run =
      Platform.OS === "android"
        ? performAndroidHapticsAsync(android)
        : Platform.OS === "ios"
          ? ios()
          : undefined;
    run?.catch(() => undefined);
  } catch {
    // Haptics are decoration: a missing engine must never break a press.
  }
}

/** A button or icon button press. */
export const tap = () =>
  fire(
    () => impactAsync(ImpactFeedbackStyle.Light),
    AndroidHaptics.Virtual_Key,
  );

/** A selection moved: a segment, a chip. */
export const selection = () =>
  fire(() => selectionAsync(), AndroidHaptics.Segment_Tick);

/** A switch or toggle flipped. */
export const toggle = (on: boolean) =>
  fire(
    () =>
      impactAsync(on ? ImpactFeedbackStyle.Medium : ImpactFeedbackStyle.Light),
    on ? AndroidHaptics.Toggle_On : AndroidHaptics.Toggle_Off,
  );

/** An action went through: liked, playlist created, songs added. */
export const confirm = () =>
  fire(
    () => notificationAsync(NotificationFeedbackType.Success),
    AndroidHaptics.Confirm,
  );

/** An action was refused or failed. */
export const reject = () =>
  fire(
    () => notificationAsync(NotificationFeedbackType.Error),
    AndroidHaptics.Reject,
  );

/** A long press opened something (a card's menu). */
export const longPress = () =>
  fire(
    () => impactAsync(ImpactFeedbackStyle.Medium),
    AndroidHaptics.Long_Press,
  );

/** A row lifted for dragging. */
export const dragStart = () =>
  fire(
    () => impactAsync(ImpactFeedbackStyle.Medium),
    AndroidHaptics.Gesture_Start,
  );

/** A gesture crossed its commit point (a full swipe). */
export const commit = () =>
  fire(
    () => impactAsync(ImpactFeedbackStyle.Rigid),
    AndroidHaptics.Gesture_Start,
  );
