import type { ArtistTab } from "@infinitunes/core/entity-route";
import type {
  Album,
  Artist,
  ArtistBioSection,
  Category,
  Song,
  SongRowItem,
} from "@infinitunes/types";
import { toCardItem, toSongRow } from "@infinitunes/types";
import { useMemo } from "react";
import type { ReactElement } from "react";

import { cardItems, songItems } from "~/components/entity-list";
import { PagedFooter } from "~/components/paged-footer";

import type { ArtistListItem } from "./artist-list-items";
import { bioItems } from "./artist-list-items";
import { OverviewShelves } from "./overview-shelves";
import { useArtistPages } from "./use-artist-pages";

/** Songs shown on the Overview before the shelves; the Songs tab lists them all. */
const OVERVIEW_SONGS = 10;

type ArtistPanel = {
  items: ArtistListItem[];
  footer: ReactElement | null;
  /** Only the paged tabs have a next page and a list of their own to refresh. */
  loadMore?: () => void;
  refetch?: () => Promise<unknown>;
};

type ArtistPanelInput = {
  artist: Artist;
  tab: ArtistTab;
  category: Category;
  /** The artist payload's own top songs as rows (the Overview's list and queue). */
  topSongs: readonly SongRowItem[];
  bio: readonly ArtistBioSection[];
};

/** What a paged tab (Songs, Albums) hands the list: its rows and a footer that pages. */
function pagedPanel(
  pages: {
    items: readonly unknown[];
    isPending: boolean;
    error: unknown;
    isFetchingNextPage: boolean;
    loadMore: () => void;
    refetch: () => Promise<unknown>;
  },
  items: ArtistListItem[],
  emptyTitle: string,
): ArtistPanel {
  return {
    items,
    footer: (
      <PagedFooter
        isPending={pages.isPending}
        error={pages.error}
        isFetchingNextPage={pages.isFetchingNextPage}
        isEmpty={pages.items.length === 0}
        emptyTitle={emptyTitle}
        onRetry={() => void pages.refetch()}
      />
    ),
    loadMore: pages.loadMore,
    refetch: pages.refetch,
  };
}

/**
 * The active tab's rows and what closes them. Songs and Albums fetch their
 * pages only while selected; the Overview and Biography come from the artist
 * payload, which the screen refetches itself.
 */
export function useArtistPanel({
  artist,
  tab,
  category,
  topSongs,
  bio,
}: ArtistPanelInput): ArtistPanel {
  const songs = useArtistPages<Song, SongRowItem>({
    artistId: artist.artistId,
    source: "songs",
    category,
    toItem: toSongRow,
    keyOf: (row) => row.id,
    enabled: tab === "songs",
  });
  const albums = useArtistPages({
    artistId: artist.artistId,
    source: "albums",
    category,
    toItem: (album: Album) => toCardItem(album),
    keyOf: (card) => card.id,
    enabled: tab === "albums",
  });

  const songListItems = useMemo(() => songItems(songs.items), [songs.items]);
  const albumListItems = useMemo(() => cardItems(albums.items), [albums.items]);
  const bioListItems = useMemo(() => bioItems(bio), [bio]);
  const overviewItems = useMemo(
    () => songItems(topSongs, OVERVIEW_SONGS),
    [topSongs],
  );

  switch (tab) {
    case "songs":
      return pagedPanel(songs, songListItems, "No songs yet");
    case "albums":
      return pagedPanel(albums, albumListItems, "No albums yet");
    case "bio":
      return {
        items: bioListItems,
        footer: null,
      };
    case "overview":
      return {
        items: overviewItems,
        footer: <OverviewShelves artist={artist} />,
      };
  }
}
