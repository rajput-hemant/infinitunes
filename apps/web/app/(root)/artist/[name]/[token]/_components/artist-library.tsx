import type { Album, Category, Song } from "@infinitunes/types";

import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { KeyedByParams } from "~/components/search-params-boundary";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";
import {
  ARTIST_LAST_INITIAL_PAGE,
  categorySort,
  isDefaultCategory,
  toArtistPage,
} from "~/lib/artist-pagination";
import { api } from "~/lib/trpc/server";
import { getViewer } from "~/lib/viewer";

import { getArtist } from "./artist-data";
import { ArtistsTopItems } from "./artists-top-items";
import { CategoryFilter } from "./category-filter";

type SearchParams = Promise<{ cat?: Category }>;

type ArtistLibraryPanelProps = {
  params: Promise<{ token: string }>;
  searchParams: SearchParams;
  type: "songs" | "albums";
};

async function Library({
  params,
  searchParams,
  type,
}: ArtistLibraryPanelProps) {
  const { token } = await params;
  const { cat } = await searchParams;
  const [artist, { user, playlists, favorites }] = await Promise.all([
    getArtist(token),
    getViewer(),
  ]);

  // The artist payload is in popularity order. Any other category starts from
  // its own first page, so the list shown is the list that was asked for.
  const sorted = !isDefaultCategory(cat);
  const request = {
    id: artist.artistId,
    page: 0,
    cat,
    sort: categorySort(cat),
  };
  const sortedSongs =
    sorted && type === "songs"
      ? toArtistPage<Song>(await api.artist.songs(request), "topSongs", "songs")
          .items
      : undefined;
  const sortedAlbums =
    sorted && type === "albums"
      ? toArtistPage<Album>(
          await api.artist.albums(request),
          "topAlbums",
          "albums",
        ).items
      : undefined;

  return (
    <ArtistsTopItems
      // A new category is a new list: fresh query, pagination back at the start.
      key={`${type}-${cat ?? "popularity"}`}
      id={artist.artistId}
      type={type}
      category={cat}
      lastInitialPage={sorted ? 0 : ARTIST_LAST_INITIAL_PAGE}
      user={user}
      userFavorites={favorites}
      userPlaylists={playlists}
      initialSongs={
        type === "songs" ? (sortedSongs ?? artist.topSongs ?? []) : undefined
      }
      initialAlbums={
        type === "albums" ? (sortedAlbums ?? artist.topAlbums) : undefined
      }
    />
  );
}

/**
 * A Songs or Albums panel: the sort filter (needs only the query string) and
 * the list (needs the artist and the visitor's library) stream separately.
 */
export function ArtistLibraryPanel(props: ArtistLibraryPanelProps) {
  return (
    <>
      <CategoryFilter />

      <KeyedByParams
        params={["cat"]}
        fallback={
          props.type === "songs" ? (
            <div className="min-h-svh">
              <SongListSkeleton length={10} />
            </div>
          ) : (
            <div className="min-h-svh">
              <CatalogGridSkeleton count={20} />
            </div>
          )
        }
      >
        <Library {...props} />
      </KeyedByParams>
    </>
  );
}
