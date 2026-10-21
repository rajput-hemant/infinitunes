import { View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import {
  EntityHeaderSkeleton,
  SongListSkeleton,
  TextBlockSkeleton,
} from "~/components/skeletons";
import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";

/** The show screen while it loads: header, description lines, the pickers and episode rows. */
export function ShowSkeleton() {
  return (
    <ScreenScrollView scrollEnabled={false}>
      <EntityHeaderSkeleton />
      <TextBlockSkeleton />
      <SkeletonPulse>
        <View className="flex-row gap-3 px-page pb-2">
          <SkeletonBlock className="h-ctl w-28 rounded-lg" />
          <SkeletonBlock className="h-ctl w-28 rounded-lg" />
        </View>
      </SkeletonPulse>
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
