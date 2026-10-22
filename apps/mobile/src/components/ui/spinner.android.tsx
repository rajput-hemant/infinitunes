import { Host, LoadingIndicator } from "@expo/ui/jetpack-compose";
import { View } from "react-native";

import { sizes } from "~/theme/tokens";
import { useTokenColor } from "~/theme/use-palette";

import type { SpinnerProps } from "./spinner";

const HOST = { width: sizes.touch, height: sizes.touch } as const;

/** Material 3 Expressive's loading indicator (morphing shapes), in primary. */
export function Spinner({
  color,
  accessibilityLabel = "Loading",
}: SpinnerProps) {
  const primary = useTokenColor("primary");
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      className="items-center"
    >
      <Host style={HOST}>
        <LoadingIndicator color={color ?? primary} />
      </Host>
    </View>
  );
}
