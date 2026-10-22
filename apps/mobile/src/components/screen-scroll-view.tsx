import { ScrollView } from "react-native";
import type { ScrollViewProps } from "react-native";

import { playerDockInset } from "~/navigation/player-dock";
import { useScrolledBar } from "~/navigation/use-scrolled-bar";

/**
 * The scroll container of a tab screen. Automatic insets let the large title
 * collapse and keep content clear of the transparent header and the tab bar;
 * the extra bottom padding clears a floating mini-player. On Android the
 * top bar tints once content scrolls under it (a screen's own `onScroll`,
 * such as a detail page's, takes over).
 */
export function ScreenScrollView({
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  const scrolledBar = useScrolledBar();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        { paddingBottom: playerDockInset },
        contentContainerStyle,
      ]}
      {...scrolledBar}
      {...props}
    />
  );
}
