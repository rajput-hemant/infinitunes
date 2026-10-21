import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshControl } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";

import { DetailFrame } from "./detail-frame";
import type { DetailFrameProps } from "./detail-frame";

type DetailScreenProps<Data> = DetailFrameProps<Data> & {
  /** The page's secondary queries, refetched with `query` on pull to refresh. */
  refreshKeys?: readonly QueryKey[];
};

/**
 * `DetailFrame` for a page that is one scroll view (album, playlist, song,
 * mix): the skeleton holds still, and pulling the loaded page refreshes it
 * together with its secondary lists.
 */
export function DetailScreen<Data>({
  query,
  skeleton,
  refreshKeys = [],
  children,
  ...frame
}: DetailScreenProps<Data>) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        query.refetch(),
        ...refreshKeys.map((queryKey) =>
          queryClient.refetchQueries({ queryKey, type: "active" }),
        ),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <DetailFrame
      query={query}
      skeleton={
        <ScreenScrollView scrollEnabled={false}>{skeleton}</ScreenScrollView>
      }
      {...frame}
    >
      {(data) => (
        <ScreenScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
            />
          }
        >
          {children(data)}
        </ScreenScrollView>
      )}
    </DetailFrame>
  );
}
