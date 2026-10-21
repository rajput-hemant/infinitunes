import type { Artist, Category } from "@infinitunes/types";
import { decode, formatCount } from "@infinitunes/types";
import { View } from "react-native";

import { EntityHeader } from "~/components/entity-header";

import type { ArtistTab } from "./artist-tabs";
import { ARTIST_TAB_LABELS, CATEGORIES, CATEGORY_LABELS } from "./artist-tabs";
import { SegmentedTabs } from "./segmented-tabs";

type ArtistListHeaderProps = {
  artist: Artist;
  tabs: readonly ArtistTab[];
  tab: ArtistTab;
  onTabChange: (tab: ArtistTab) => void;
  category: Category;
  onCategoryChange: (category: Category) => void;
  onPlay: () => void;
  onShuffle: () => void;
};

function listenersLabel(artist: Artist): string | undefined {
  return Number(artist.fan_count) > 0
    ? `${formatCount(artist.fan_count)} Listeners`
    : undefined;
}

/**
 * The artist screen's list header: the artist, their section tabs and, on
 * the paged tabs, the sort order. It stays mounted across tab changes.
 */
export function ArtistListHeader({
  artist,
  tabs,
  tab,
  onTabChange,
  category,
  onCategoryChange,
  onPlay,
  onShuffle,
}: ArtistListHeaderProps) {
  const isPaged = tab === "songs" || tab === "albums";

  return (
    <View className="gap-3 pb-2">
      <EntityHeader
        image={artist.image}
        title={decode(artist.name)}
        subtitle={listenersLabel(artist)}
        round
        onPlay={onPlay}
        onShuffle={onShuffle}
        like={{ type: "artist", token: artist.artistId }}
      />
      <SegmentedTabs
        testID="artist-tabs"
        tabs={tabs}
        labels={ARTIST_TAB_LABELS}
        value={tab}
        onChange={onTabChange}
      />
      {isPaged ? (
        <SegmentedTabs
          testID="artist-sort"
          tabs={CATEGORIES}
          labels={CATEGORY_LABELS}
          value={category}
          onChange={onCategoryChange}
        />
      ) : null}
    </View>
  );
}
