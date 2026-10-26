import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { createContext, use, useMemo } from "react";
import type { ReactNode } from "react";
import type { ScrollViewProps } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { playerDockInset } from "~/navigation/player-dock";

import { DetailFrame } from "./detail-frame";
import type { DetailFrameProps } from "./detail-frame";
import { useDetailScrollProps } from "./detail-scroll";

type DetailScreenProps<Data> = DetailFrameProps<Data> & {
  /** The page's secondary queries, refetched with `query` on pull to refresh. */
  refreshKeys?: readonly QueryKey[];
  /**
   * The page is its own scroll view: `children` renders a list (such as
   * `TrackListPage`) that spreads `useDetailListProps()`, so a long track
   * list is virtualized instead of every row sitting in one scroll view.
   */
  list?: boolean;
};

/** A `list` page's pull to refresh: the page query and its secondary lists. */
const DetailRefreshContext = createContext<
  (() => Promise<unknown>) | undefined
>(undefined);

/**
 * `DetailFrame` for a page that is one scroll view (album, playlist, song,
 * mix): the skeleton holds still, and pulling the loaded page refreshes it
 * together with its secondary lists. With `list`, the page's own list is
 * that scroll view.
 */
export function DetailScreen<Data>({
  query,
  skeleton,
  refreshKeys = [],
  list = false,
  children,
  ...frame
}: DetailScreenProps<Data>) {
  const queryClient = useQueryClient();

  function refresh() {
    return Promise.all([
      query.refetch(),
      ...refreshKeys.map((queryKey) =>
        queryClient.refetchQueries({ queryKey, type: "active" }),
      ),
    ]);
  }

  return (
    <DetailFrame
      query={query}
      skeleton={
        <ScreenScrollView scrollEnabled={false}>{skeleton}</ScreenScrollView>
      }
      {...frame}
    >
      {(data): ReactNode =>
        list ? (
          <DetailRefreshContext value={refresh}>
            {children(data)}
          </DetailRefreshContext>
        ) : (
          <DetailScrollView
            refreshControl={<PullToRefresh onRefresh={refresh} />}
          >
            {children(data)}
          </DetailScrollView>
        )
      }
    </DetailFrame>
  );
}

/** The loaded page's scroll view, reporting when it scrolls under the bar. */
function DetailScrollView(props: ScrollViewProps) {
  return <ScreenScrollView {...props} {...useDetailScrollProps()} />;
}

/**
 * Spread on a `list` page's list (a `FlashList`): what `ScreenScrollView`
 * and `DetailScrollView` give a scroll view (automatic insets, the player
 * dock's padding, the bar's scrolled state), plus the page's pull to refresh.
 */
export function useDetailListProps() {
  const refresh = use(DetailRefreshContext);
  const scrollProps = useDetailScrollProps();
  return useMemo(
    () => ({
      contentInsetAdjustmentBehavior: "automatic" as const,
      contentContainerStyle: { paddingBottom: playerDockInset },
      refreshControl: refresh ? (
        <PullToRefresh onRefresh={refresh} />
      ) : undefined,
      ...scrollProps,
    }),
    [refresh, scrollProps],
  );
}
