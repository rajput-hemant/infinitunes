import { FlashList } from "@shopify/flash-list";
import type { ComponentProps, ReactElement } from "react";
import { ActivityIndicator, View } from "react-native";

import { CatalogGridSkeleton } from "~/components/catalog-grid-skeleton";
import { EmptyState } from "~/components/empty-state";
import { ErrorState } from "~/components/error-state";
import { Text } from "~/components/ui/text";
import {
  GRID_COLUMNS,
  GRID_GAP,
  useGridCardWidth,
} from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
import { sizes } from "~/theme/tokens";

/** What a catalog list reads from its query; paging fields are absent for a single page. */
type CatalogQuery<Item> = {
  items: readonly Item[];
  isPending: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  isRefetching: boolean;
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
};

const SEEN_IT_ALL = "You have seen it all";

/** Cancels the grid's content padding for full-bleed parts (header, placeholders). */
const FULL_BLEED = { marginHorizontal: -(sizes.page - GRID_GAP / 2) };

/**
 * A two-column catalog grid with every state of a fetched list: skeleton,
 * error with retry (only while there is nothing to show), empty, pull to
 * refresh and endless paging. One list stays mounted so the header and the
 * scroll container survive a language change.
 */
export function CatalogScreen<Item>({
  query,
  keyOf,
  renderCard,
  empty,
  header,
}: CatalogScreenProps<Item>) {
  const width = useGridCardWidth();
  const { items } = query;

  return (
    <FlashList
      data={items}
      numColumns={GRID_COLUMNS}
      keyExtractor={keyOf}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: GRID_GAP / 2, paddingVertical: 6 }}>
          {renderCard(item, width)}
        </View>
      )}
      ListHeaderComponent={
        header ? <View style={FULL_BLEED}>{header}</View> : undefined
      }
      ListEmptyComponent={
        <View style={FULL_BLEED}>
          <CatalogPlaceholder query={query} empty={empty} />
        </View>
      }
      ListFooterComponent={<CatalogFooter query={query} />}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingHorizontal: sizes.page - GRID_GAP / 2,
        paddingBottom: playerDockInset,
      }}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      onEndReached={query.loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}

function CatalogPlaceholder<Item>({
  query,
  empty,
}: Pick<CatalogScreenProps<Item>, "query" | "empty">) {
  if (query.isPending) return <CatalogGridSkeleton />;
  if (query.error) {
    return (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    );
  }
  return <EmptyState {...empty} />;
}

function CatalogFooter<Item>({ query }: { query: CatalogQuery<Item> }) {
  if (query.isFetchingNextPage) {
    return <ActivityIndicator className="py-6" />;
  }
  if (query.items.length > 0 && !query.hasNextPage) {
    return (
      <Text tone="muted" className="py-6 text-center">
        {SEEN_IT_ALL}
      </Text>
    );
  }
  return null;
}
