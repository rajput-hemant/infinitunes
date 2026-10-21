import type { NativeStackNavigationOptions } from "expo-router";

import { IconButton } from "~/components/ui/icon-button";
import { shareItem } from "~/lib/share";
import type { ShareableItem } from "~/lib/share";

/**
 * Native header of a detail screen. The entity's own header carries the big
 * title, so the bar keeps a small one; Share sits at its trailing edge. With no
 * item yet (loading, failed) the bar is empty rather than showing the route name.
 */
export function detailHeaderOptions(
  item?: ShareableItem,
): NativeStackNavigationOptions {
  return {
    title: item?.name ?? "",
    headerLargeTitle: false,
    headerRight: item
      ? () => (
          <IconButton
            icon={{ ios: "square.and.arrow.up", android: "share" }}
            label={`Share ${item.name}`}
            onPress={() => shareItem(item)}
          />
        )
      : undefined,
  };
}
