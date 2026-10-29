import type { ArtistTab } from "@infinitunes/core/entity-route";
import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  MediaListSkeleton,
  SegmentedTabsSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
  TextBlockSkeleton,
} from "~/components/skeletons";

/** The artist screen while its payload loads: header, tab row, top songs and a shelf. */
export function ArtistSkeleton({ tab = "overview" }: { tab?: ArtistTab }) {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <View className="gap-2 pb-2">
        <EntityHeaderSkeleton round subtitle={false} />
        <SegmentedTabsSkeleton />
      </View>
      {tab === "albums" ? (
        <MediaListSkeleton rows={5} />
      ) : tab === "bio" ? (
        <TextBlockSkeleton />
      ) : (
        <SongListSkeleton rows={5} />
      )}
      {tab === "overview" ? <ShelfSkeleton /> : null}
    </ScreenScrollView>
  );
}
