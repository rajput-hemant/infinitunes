import type { ArtistTab } from "@infinitunes/core/entity-route";
import type { Artist, Category, SongRowItem } from "@infinitunes/types";
import { decode, formatCount } from "@infinitunes/types";
import { View } from "react-native";

import { CollectionMenu } from "~/components/collection-menu";
import { EntityHeader } from "~/components/entity-header";
import { SegmentedTabs } from "~/components/segmented-tabs";
import { playAll, shuffleAll } from "~/playback/play-collection";

import { ARTIST_TAB_LABELS, CATEGORIES, CATEGORY_LABELS } from "./artist-tabs";

type ArtistListHeaderProps = {
  artist: Artist;
  tabs: readonly ArtistTab[];
  tab: ArtistTab;
  onTabChange: (tab: ArtistTab) => void;
  category: Category;
  onCategoryChange: (category: Category) => void;
  /** The Overview's songs: what Play, Shuffle and the menu queue. */
  topSongs: readonly SongRowItem[];
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
  topSongs,
}: ArtistListHeaderProps) {
  const name = decode(artist.name);
  const isPaged = tab === "songs" || tab === "albums";

  return (
    <View className="gap-3 pb-2">
      <EntityHeader
        image={artist.image}
        title={name}
        subtitle={listenersLabel(artist)}
        round
        onPlay={() => playAll(topSongs)}
        onShuffle={() => shuffleAll(topSongs)}
        like={{ type: "artist", token: artist.artistId }}
        actions={
          <CollectionMenu
            name={name}
            rows={topSongs}
            radio={{
              name,
              artistId: artist.artistId,
              language: artist.dominantLanguage,
            }}
          />
        }
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
