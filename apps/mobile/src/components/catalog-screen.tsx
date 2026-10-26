import { FlashList } from "@shopify/flash-list";
import { type ComponentProps, type ReactElement, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { CatalogGridSkeleton } from "~/components/catalog-grid-skeleton";
import { EmptyState } from "~/components/empty-state";
import { EndOfList } from "~/components/end-of-list";
import { ErrorState } from "~/components/error-state";
import { GridCell } from "~/components/grid-cell";
import { CONTENT_CONCEAL } from "~/components/skeletons";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { Spinner } from "~/components/ui/spinner";
import { useGrid } from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
import { useScrolledBar } from "~/navigation/use-scrolled-bar";

/** What a catalog list reads from its query; paging fields are absent for a single page. */
type CatalogQuery<Item> = {
  items: readonly Item[];
  isPending: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  loadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
};

type CatalogScreenProps<Item> = {
  query: CatalogQuery<Item>;
  keyOf: (item: Item) => string;
  renderCard: (item: Item, width: number) => ReactElement;
  /** Shown when the catalog answers with no items. */
  empty: Pick<ComponentProps<typeof EmptyState>, "icon" | "title" | "message">;
  /** Stays on screen in every state (language chips, the intro line). */
  header?: ReactElement;
  /** The cards' art is round (artists, stations): the skeleton's too. */
  round?: boolean;
};

const SEEN_IT_ALL = "You have seen it all";

/** Opacity alone carries no movement, so it runs under reduce motion too. */
const REVEAL = { duration: 200, reduceMotion: ReduceMotion.Never };

/**
 * A catalog card grid (three columns on a phone) with every state of a fetched list: skeleton,
 * error with retry (only while there is nothing to show), empty, pull to
 * refresh and endless paging. One list stays mounted so the header and the
 * scroll container survive a language change.
 *
 * The cards that replace the skeleton fade in together. One shared opacity,
 * not an `entering` per cell: cells FlashList mounts later (a fast fling, a
 * new page) and recycled ones read 1 and show at once.
 */
export function CatalogScreen<Item>({
  query,
  keyOf,
  renderCard,
  empty,
  header,
  round = false,
}: CatalogScreenProps<Item>) {
  const { columns, width } = useGrid("cards");
  const { items } = query;
  const scrolledBar = useScrolledBar();
  const loaded = items.length > 0;
  // Already loaded at mount (a cached list): no fade.
  const opacity = useSharedValue(loaded ? 1 : 0);
  useEffect(() => {
    opacity.set(loaded ? withTiming(1, REVEAL) : 0);
  }, [loaded, opacity]);
  const reveal = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <FlashList
      data={items}
      numColumns={columns}
      keyExtractor={keyOf}
      renderItem={({ item, index }) => (
        <Animated.View style={reveal}>
          <GridCell index={index} columns={columns}>
            {renderCard(item, width)}
          </GridCell>
        </Animated.View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <CatalogPlaceholder query={query} empty={empty} round={round} />
      }
      ListFooterComponent={<CatalogFooter query={query} />}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: playerDockInset }}
      refreshControl={<PullToRefresh onRefresh={query.refetch} />}
      onEndReached={query.loadMore}
      onEndReachedThreshold={0.5}
      {...scrolledBar}
    />
  );
}

function CatalogPlaceholder<Item>({
  query,
  empty,
  round,
}: Pick<CatalogScreenProps<Item>, "query" | "empty" | "round">) {
  if (query.isPending) {
    // Fades out as the cards fade in; Reanimated keeps the exiting view at its
    // frame, over the new rows, so the layout does not jump.
    return (
      <Animated.View exiting={CONTENT_CONCEAL} testID="catalog-skeleton">
        <CatalogGridSkeleton round={round} />
      </Animated.View>
    );
  }
  if (query.error) {
    return (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    );
  }
  return <EmptyState {...empty} />;
}

function CatalogFooter<Item>({ query }: { query: CatalogQuery<Item> }) {
  if (query.isFetchingNextPage) {
    return (
      <View className="py-6">
        <Spinner />
      </View>
    );
  }
  if (query.items.length > 0 && !query.hasNextPage) {
    return <EndOfList>{SEEN_IT_ALL}</EndOfList>;
  }
  return null;
}
