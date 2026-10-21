import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { EntityHeaderSkeleton, SongListSkeleton } from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";

/** The label screen while it loads: header, the Songs/Albums switch and a list. */
export function LabelSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <SkeletonPulse>
        <View className="px-page pb-2">
          <SkeletonBlock className="h-9 w-full rounded-lg" />
        </View>
      </SkeletonPulse>
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
