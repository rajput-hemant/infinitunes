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
  isRefetching?: boolean;
};

type ArtistPanelInput = {
  artist: Artist;
  tab: ArtistTab;
  category: Category;
  /** The artist payload's own top songs as rows (the Overview's list and queue). */
  topSongs: readonly SongRowItem[];
  bio: readonly ArtistBioSection[];
};

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

  switch (tab) {
    case "songs":
      return {
        items: songItems(songs.items),
        footer: (
          <PagedFooter
            isPending={songs.isPending}
            error={songs.error}
            isFetchingNextPage={songs.isFetchingNextPage}
            isEmpty={songs.items.length === 0}
            emptyTitle="No songs yet"
            onRetry={() => void songs.refetch()}
          />
        ),
        loadMore: songs.loadMore,
        refetch: songs.refetch,
        isRefetching: songs.isRefetching,
      };
    case "albums":
      return {
        items: cardItems(albums.items),
        footer: (
          <PagedFooter
            isPending={albums.isPending}
            error={albums.error}
            isFetchingNextPage={albums.isFetchingNextPage}
            isEmpty={albums.items.length === 0}
            emptyTitle="No albums yet"
            onRetry={() => void albums.refetch()}
          />
        ),
        loadMore: albums.loadMore,
        refetch: albums.refetch,
        isRefetching: albums.isRefetching,
      };
    case "bio":
      return {
        items: bioItems(bio),
        footer: null,
      };
    case "overview":
      return {
        items: songItems(topSongs, OVERVIEW_SONGS),
        footer: <OverviewShelves artist={artist} />,
      };
  }
}
