import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";

import { GridCell } from "~/components/grid-cell";
import { MediaCard } from "~/components/media-card";
import { ShelfSkeleton } from "~/components/skeletons";
import { Text } from "~/components/ui/text";
import { CARD_COLUMNS, useGridCardWidth } from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
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
  const cardWidth = useGridCardWidth(CARD_COLUMNS);

  return (
    <LibraryListView
      list={list}
      skeleton={<ShelfSkeleton cards={CARD_COLUMNS} />}
      empty={{
        icon,
        title: `No ${title.toLowerCase()} yet`,
        message: emptyMessage,
      }}
    >
      {({ items, missing, refreshing, refresh }) => (
        <FlashList
          data={items}
          numColumns={CARD_COLUMNS}
          keyExtractor={(card) => card.url}
          renderItem={({ item, index }) => (
            <GridCell index={index}>
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
          refreshing={refreshing}
          onRefresh={refresh}
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
