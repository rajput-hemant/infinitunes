import { ActivityIndicator, View } from "react-native";
import type { ColorValue } from "react-native";

import { sizes } from "~/theme/tokens";

export type SpinnerProps = {
  /** Defaults to the platform's (iOS) or the primary colour (Android). */
  color?: ColorValue;
  accessibilityLabel?: string;
};

const HOST = { width: sizes.touch, height: sizes.touch } as const;

/**
 * An indeterminate loading mark: iOS's activity indicator, in a touch-height
 * box and one accessible progressbar, as Android's is.
 */
export function Spinner({
  color,
  accessibilityLabel = "Loading",
}: SpinnerProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      className="items-center justify-center"
      style={HOST}
    >
      <ActivityIndicator color={color} />
    </View>
  );
}
