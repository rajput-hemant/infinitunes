import { ScrollView } from "react-native";
import type { ScrollViewProps } from "react-native";

import { playerDockInset } from "~/navigation/player-dock";

/**
 * The scroll container of a tab screen. Automatic insets let the large title
 * collapse and keep content clear of the transparent header and the tab bar;
 * the extra bottom padding clears a floating mini-player.
 */
export function ScreenScrollView({
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        { paddingBottom: playerDockInset },
        contentContainerStyle,
      ]}
      {...props}
    />
  );
}
