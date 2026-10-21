import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { EntityHeaderSkeleton, SongListSkeleton } from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";

/** The show screen while it loads: header, description lines, the pickers and episode rows. */
export function ShowSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <SkeletonPulse>
        <View className="gap-2 px-page pb-3">
          <SkeletonBlock className="h-5 w-2/5 rounded-sm" />
          <SkeletonBlock className="h-3.5 w-full rounded-sm" />
          <SkeletonBlock className="h-3.5 w-4/5 rounded-sm" />
        </View>
        <View className="flex-row gap-3 px-page pb-2">
          <SkeletonBlock className="h-ctl w-28 rounded-lg" />
          <SkeletonBlock className="h-ctl w-28 rounded-lg" />
        </View>
      </SkeletonPulse>
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
