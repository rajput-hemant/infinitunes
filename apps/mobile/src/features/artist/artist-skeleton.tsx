import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  ShelfSkeleton,
  SongListSkeleton,
} from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";

/** The artist screen while its payload loads: header, tab row, top songs and a shelf. */
export function ArtistSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <SkeletonPulse>
        <View className="px-page pb-2">
          <SkeletonBlock className="h-9 w-full rounded-lg" />
        </View>
      </SkeletonPulse>
      <SongListSkeleton rows={5} />
      <ShelfSkeleton />
    </ScreenScrollView>
  );
}
