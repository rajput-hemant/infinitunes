import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";

import { CatalogGridSkeleton } from "~/components/catalog-grid-skeleton";
import { GridCell } from "~/components/grid-cell";
import { MediaCard } from "~/components/media-card";
import { ScreenScrollView } from "~/components/screen-scroll-view";
import { PullToRefresh } from "~/components/ui/refresh-control";
import { Text } from "~/components/ui/text";
import { useGrid } from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
import { useScrolledBar } from "~/navigation/use-scrolled-bar";
import { sizes } from "~/theme/tokens";

import { LibraryListView } from "./library-list-view";
import {
  LIKED_COLLECTIONS,
  type LikedCollectionKind,
} from "./liked-collections";
import { SignedInGate } from "./signed-in-gate";
import { useLikedCollection } from "./use-liked-collection";

function LikedCollection({ kind }: { kind: LikedCollectionKind }) {
  const { title, emptyMessage, icon } = LIKED_COLLECTIONS[kind];
  const list = useLikedCollection(kind);
  const { columns, width: cardWidth } = useGrid("cards");
  const scrolledBar = useScrolledBar();

  return (
    <LibraryListView
      list={list}
      skeleton={
        // The loaded grid's geometry: three columns, round for artists.
        <ScreenScrollView
          scrollEnabled={false}
          contentContainerStyle={{ paddingTop: sizes.page }}
        >
          <CatalogGridSkeleton round={kind === "artists"} />
        </ScreenScrollView>
      }
      empty={{
        icon,
        title: `No ${title.toLowerCase()} yet`,
        message: emptyMessage,
      }}
    >
      {({ items, missing, refresh }) => (
        <FlashList
          data={items}
          numColumns={columns}
          keyExtractor={(card) => card.url}
          renderItem={({ item, index }) => (
            <GridCell index={index} columns={columns}>
              <MediaCard item={item} width={cardWidth} />
            </GridCell>
          )}
          ListHeaderComponent={
            missing > 0 ? (
              <Text variant="caption" tone="muted" className="px-page pb-3">
                {missing === 1 ? "1 item" : `${missing} items`} couldn't load.
                Pull down to try again.
              </Text>
            ) : null
          }
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingTop: sizes.page,
            paddingBottom: playerDockInset,
          }}
          refreshControl={<PullToRefresh onRefresh={refresh} />}
          {...scrolledBar}
        />
      )}
    </LibraryListView>
  );
}

export function LikedCollectionScreen({ kind }: { kind: LikedCollectionKind }) {
  return (
    <>
      <Stack.Screen options={{ title: LIKED_COLLECTIONS[kind].title }} />
      <SignedInGate>
        <LikedCollection kind={kind} />
      </SignedInGate>
    </>
  );
}
