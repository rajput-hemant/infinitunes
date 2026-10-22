import { useState } from "react";
import { RefreshControl } from "react-native";

import { usePalette } from "~/theme/use-palette";

type PullToRefreshProps = {
  /** Refetches the screen's queries; the spinner stays until it settles. */
  onRefresh: () => Promise<unknown>;
};

/**
 * The `refreshControl` of every scroll view and list: Android's spinner in
 * the primary colour on a `card` disc (the stock one is white on white),
 * iOS's system spinner. It shows only for a pull: a query's background
 * `isRefetching` must not drive it, or the spinner sits open on a focus
 * refetch the listener never asked for.
 */
export function PullToRefresh({ onRefresh }: PullToRefreshProps) {
  const palette = usePalette();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      colors={[palette.primary]}
      progressBackgroundColor={palette.card}
    />
  );
}
