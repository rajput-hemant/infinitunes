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
      <EntityHeaderSkeleton menu={false} />
      <TextBlockSkeleton />
      <SkeletonPulse>
        {/* The season and order pills. */}
        <View className="flex-row gap-3 px-page py-2">
          <SkeletonBlock className="h-ctl w-1/4 rounded-full" />
          <SkeletonBlock className="h-ctl w-1/4 rounded-full" />
        </View>
      </SkeletonPulse>
      <SongListSkeleton />
    </ScreenScrollView>
  );
}
