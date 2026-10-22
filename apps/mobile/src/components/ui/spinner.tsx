import { ActivityIndicator } from "react-native";
import type { ColorValue } from "react-native";

export type SpinnerProps = {
  /** Defaults to the platform's (iOS) or the primary colour (Android). */
  color?: ColorValue;
  accessibilityLabel?: string;
};

/** An indeterminate loading mark: iOS's activity indicator. */
export function Spinner({ color, accessibilityLabel }: SpinnerProps) {
  return (
    <ActivityIndicator color={color} accessibilityLabel={accessibilityLabel} />
  );
}
