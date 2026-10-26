import { View } from "react-native";

import { CardTextSkeleton } from "~/components/skeletons";
import { FULL_RADIUS } from "~/components/ui/artwork";
import { range, SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { GRID_GAP, useGrid } from "~/lib/use-grid-card-width";
import { useRadii } from "~/theme/use-radii";

const ROWS = 3;

/** Placeholder cards at the real grid geometry, so the list lands without a jump. */
export function CatalogGridSkeleton({ round = false }: { round?: boolean }) {
  const scale = useRadii();
  const radius = round ? FULL_RADIUS : scale.md;
  const { columns, width } = useGrid("cards");

  return (
    <SkeletonPulse>
      <View className="px-page" style={{ gap: GRID_GAP }}>
        {range(ROWS).map((row) => (
          <View key={row} className="flex-row" style={{ gap: GRID_GAP }}>
            {range(columns).map((column) => (
              <View key={column} className="gap-2" style={{ width }}>
                <SkeletonBlock
                  style={{ width, height: width, borderRadius: radius }}
                />
                {/* Round cards centre their text (`MediaCard`). */}
                <View className={round ? "items-center" : undefined}>
                  <CardTextSkeleton />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}
