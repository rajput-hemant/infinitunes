import type { Season, Sort } from "@infinitunes/types";
import { decode, uniqueBy } from "@infinitunes/types";
import { View } from "react-native";

import { OptionMenu } from "~/components/option-menu";

const SORT_OPTIONS = [
  { id: "desc", title: "Newest" },
  { id: "asc", title: "Oldest" },
] as const satisfies readonly { id: Sort; title: string }[];

/** Latest season first (upstream lists them oldest first), one entry per season. */
function seasonOptions(seasons: readonly Season[]) {
  return uniqueBy(seasons.toReversed(), (season) => season.id).map(
    (season) => ({
      id: String(Number(season.more_info.season_number)),
      title: decode(season.title),
    }),
  );
}

type ShowControlsProps = {
  seasons: readonly Season[];
  season: number;
  onSeasonChange: (season: number) => void;
  sort: Sort;
  onSortChange: (sort: Sort) => void;
};

/** The episode list's season and order pickers; a single-season show has no season picker. */
export function ShowControls({
  seasons,
  season,
  onSeasonChange,
  sort,
  onSortChange,
}: ShowControlsProps) {
  return (
    <View className="flex-row items-center gap-3 px-page py-2">
      {seasons.length > 1 ? (
        <OptionMenu
          testID="season-menu"
          label="Season"
          options={seasonOptions(seasons)}
          selectedId={String(season)}
          onSelect={(id) => onSeasonChange(Number(id))}
        />
      ) : null}
      <OptionMenu
        testID="sort-menu"
        label="Order"
        options={SORT_OPTIONS}
        selectedId={sort}
        onSelect={onSortChange}
      />
    </View>
  );
}
