import { View } from "react-native";

import { SkeletonBlock, SkeletonPulse } from "~/components/ui/skeleton";
import { radii } from "~/theme/tokens";

import {
  GRID_COLUMNS,
  GRID_GAP,
  useGridCardWidth,
} from "./use-grid-card-width";

const ROWS = 3;

const range = (count: number) => Array.from({ length: count }, (_, i) => i);

/** Placeholder cards at the real grid geometry, so the list lands without a jump. */
export function CatalogGridSkeleton() {
  const width = useGridCardWidth();

  return (
    <SkeletonPulse>
      <View className="px-page" style={{ gap: GRID_GAP }}>
        {range(ROWS).map((row) => (
          <View key={row} className="flex-row" style={{ gap: GRID_GAP }}>
            {range(GRID_COLUMNS).map((column) => (
              <View key={column} className="gap-1.5">
                <SkeletonBlock
                  style={{ width, height: width, borderRadius: radii.md }}
                />
                <SkeletonBlock className="h-3 w-4/5 rounded-sm" />
              </View>
            ))}
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}
