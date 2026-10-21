import type { NativeStackNavigationOptions } from "expo-router";

import { IconButton } from "~/components/ui/icon-button";
import { shareItem } from "~/lib/share";

/** An item the header names and shares: its decoded title and perma URL. */
export type SharedItem = { name: string; url: string };

/**
 * Native header of a detail screen. The entity's own header carries the big
 * title, so the bar keeps a small one; Share sits at its trailing edge. With no
 * item yet (loading, failed) the bar is empty rather than showing the route name.
 */
export function detailHeaderOptions(
  item?: SharedItem,
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
