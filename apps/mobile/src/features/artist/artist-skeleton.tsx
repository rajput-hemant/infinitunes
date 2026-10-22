import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  SegmentedTabsSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";

/** The artist screen while its payload loads: header, tab row, top songs and a shelf. */
export function ArtistSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <View className="gap-2 pb-2">
        <EntityHeaderSkeleton round subtitle={false} />
        <SegmentedTabsSkeleton />
      </View>
      <SongListSkeleton rows={5} />
      <ShelfSkeleton />
    </ScreenScrollView>
  );
}
