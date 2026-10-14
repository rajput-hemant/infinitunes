import type { Category } from "@infinitunes/types";
import { Suspense } from "react";

import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";
import { getViewer } from "~/lib/viewer";

import { getArtist } from "./artist-data";
import { CategoryFilterSkeleton } from "./artist-skeleton";
import { ArtistsTopItems } from "./artists-top-items";
import { CategoryFilter } from "./category-filter";

type SearchParams = Promise<{ cat?: Category }>;

type ArtistLibraryPanelProps = {
  params: Promise<{ token: string }>;
  searchParams: SearchParams;
  type: "songs" | "albums";
};

async function Filter({ searchParams }: { searchParams: SearchParams }) {
  const { cat } = await searchParams;

  return <CategoryFilter category={cat ?? "popularity"} />;
}

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

  return (
    <ArtistsTopItems
      key={
        type === "songs" ? artist.topSongs?.[0]?.id : artist.topAlbums?.[0]?.id
      }
      id={artist.artistId}
      type={type}
      category={cat}
      user={user}
      userFavorites={favorites}
      userPlaylists={playlists}
      initialSongs={type === "songs" ? (artist.topSongs ?? []) : undefined}
      initialAlbums={type === "albums" ? artist.topAlbums : undefined}
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
      <Suspense fallback={<CategoryFilterSkeleton />}>
        <Filter searchParams={props.searchParams} />
      </Suspense>

      <Suspense
        fallback={
          props.type === "songs" ? (
            <SongListSkeleton length={10} />
          ) : (
            <CatalogGridSkeleton count={20} />
          )
        }
      >
        <Library {...props} />
      </Suspense>
    </>
  );
}
