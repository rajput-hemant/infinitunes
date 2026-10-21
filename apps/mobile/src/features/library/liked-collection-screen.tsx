import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";
import { View } from "react-native";

import { MediaCard } from "~/components/media-card";
import { ShelfSkeleton } from "~/components/skeletons";
import { Text } from "~/components/ui/text";
import {
  GRID_COLUMNS,
  GRID_GAP,
  useGridCardWidth,
} from "~/lib/use-grid-card-width";
import { playerDockInset } from "~/navigation/player-dock";
import { sizes } from "~/theme/tokens";

import { LibraryListView } from "./library-list-view";
import {
  LIKED_COLLECTIONS,
  type LikedCollectionKind,
} from "./liked-collections";
import { SignedInGate } from "./signed-in-gate";
import { useLikedCollection } from "./use-liked-collection";

/** Each cell carries half the gap on every side, so the content pads the rest of the gutter. */
const CELL = { padding: GRID_GAP / 2 };

function LikedCollection({ kind }: { kind: LikedCollectionKind }) {
  const { title, emptyMessage, icon } = LIKED_COLLECTIONS[kind];
  const list = useLikedCollection(kind);
  const cardWidth = useGridCardWidth();

  return (
    <LibraryListView
      list={list}
      skeleton={<ShelfSkeleton cards={GRID_COLUMNS} />}
      empty={{
        icon,
        title: `No ${title.toLowerCase()} yet`,
        message: emptyMessage,
      }}
    >
      {({ items, missing, refreshing, refresh }) => (
        <FlashList
          data={items}
          numColumns={GRID_COLUMNS}
          keyExtractor={(card) => card.url}
          renderItem={({ item }) => (
            <View style={CELL}>
              <MediaCard item={item} width={cardWidth} />
            </View>
          )}
          ListHeaderComponent={
            missing > 0 ? (
              <Text variant="caption" tone="muted" style={CELL}>
                {missing === 1 ? "1 item" : `${missing} items`} couldn't load.
                Pull down to try again.
              </Text>
            ) : null
          }
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingHorizontal: sizes.page - GRID_GAP / 2,
            paddingTop: sizes.page - GRID_GAP / 2,
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
