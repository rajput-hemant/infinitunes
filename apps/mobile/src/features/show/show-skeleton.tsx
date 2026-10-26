import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  SongListSkeleton,
  TextBlockSkeleton,
} from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";

/** The show screen while it loads: header, description lines, the order picker and episode rows. */
export function ShowSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <TextBlockSkeleton />
      <SkeletonPulse>
        {/* The order pill (`OptionMenu`): 40pt drawn in its 48pt target. Only
            a show with several seasons adds a season pill beside it. */}
        <View className="flex-row gap-3 px-page py-2">
          <View className="min-h-touch w-1/4 justify-center">
            <SkeletonBlock className="h-ctl rounded-full" />
          </View>
        </View>
      </SkeletonPulse>
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
