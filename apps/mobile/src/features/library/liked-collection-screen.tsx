import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";
import { useWindowDimensions, View } from "react-native";

import { MediaCard } from "~/components/media-card";
import { ShelfSkeleton } from "~/components/skeletons";
import { Text } from "~/components/ui/text";
import { playerDockInset } from "~/navigation/player-dock";
import { sizes } from "~/theme/tokens";

import { LibraryListView } from "./library-list-view";
import {
  LIKED_COLLECTIONS,
  type LikedCollectionKind,
} from "./liked-collections";
import { SignedInGate } from "./signed-in-gate";
import { useLikedCollection } from "./use-liked-collection";

const COLUMNS = 2;
const COLUMN_GAP = 12;

function LikedCollection({ kind }: { kind: LikedCollectionKind }) {
  const { title, emptyMessage, icon } = LIKED_COLLECTIONS[kind];
  const list = useLikedCollection(kind);
  const { width } = useWindowDimensions();
  const cardWidth = (width - sizes.page * 2 - COLUMN_GAP) / COLUMNS;

  return (
    <LibraryListView
      list={list}
      skeleton={<ShelfSkeleton cards={COLUMNS} />}
      empty={{
        icon,
        title: `No ${title.toLowerCase()} yet`,
        message: emptyMessage,
      }}
    >
      {({ items, missing, refreshing, refresh }) => (
        <FlashList
          data={items}
          numColumns={COLUMNS}
          keyExtractor={(card) => card.url}
          renderItem={({ item, index }) => (
            <View
              className="pb-4"
              style={{
                // Half a gap on each side of the seam between the columns.
                paddingLeft: index % COLUMNS === 0 ? 0 : COLUMN_GAP / 2,
                paddingRight: index % COLUMNS === 0 ? COLUMN_GAP / 2 : 0,
              }}
            >
              <MediaCard item={item} width={cardWidth} />
            </View>
          )}
          ListHeaderComponent={
            missing > 0 ? (
              <Text variant="caption" tone="muted" className="pb-2">
                {missing === 1 ? "1 item" : `${missing} items`} couldn't load.
                Pull down to try again.
              </Text>
            ) : null
          }
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingHorizontal: sizes.page,
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
