import { AccessibilityInfo } from "react-native";

/**
 * Has VoiceOver say `message` once it is done with what it is speaking now.
 * Nothing on screen has to change: use it for the result of a press (liked,
 * queued) that a screen reader cannot see.
 */
export function announce(message: string): void {
  AccessibilityInfo.announceForAccessibilityWithOptions(message, {
    queue: true,
  });
}
