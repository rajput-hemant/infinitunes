"use client";

import {
  ARTIST_LAST_INITIAL_PAGE,
  categorySort,
  nextArtistPage,
  toArtistPage,
} from "@infinitunes/core/artist-pagination";
import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Album, Category, Song, SongRowItem } from "@infinitunes/types";
import { toSongRow, uniqueBy } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { QueryScope } from "~/components/query-scope";
import { SliderCard } from "~/components/slider/slider-card";
import { SongListClient } from "~/components/song-list/song-list.client";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { trpc } from "~/lib/trpc/vanilla";
import { cn } from "~/lib/utils";

type LoadMoreProps = {
  hasNextPage: boolean;
  isFetching: boolean;
  onClick: () => void;
};

function LoadMore({ hasNextPage, isFetching, onClick }: LoadMoreProps) {
  if (!hasNextPage) return null;

  return (
    <Button
      variant="outline"
      className={cn(controlStyles.text, "mx-auto my-4 flex text-center")}
      onClick={onClick}
    >
      {isFetching ? "Loading..." : "Load More"}
    </Button>
  );
}

type ArtistsTopItemsProps = {
  id: string;
  type: "songs" | "albums";
  initialSongs?: SongRowItem[];
  initialAlbums?: Album[];
  category?: Category;
  /** The upstream page `initialSongs`/`initialAlbums` came from; the next fetch is the one after it. */
  lastInitialPage?: number;
  user?: User;
  userFavorites?: Favorite | null;
  userPlaylists?: MyPlaylist[];
};

type TopSongsProps = Pick<
  ArtistsTopItemsProps,
  | "id"
  | "category"
  | "lastInitialPage"
  | "user"
  | "userFavorites"
  | "userPlaylists"
> & { initialSongs: SongRowItem[] };

function ArtistTopSongs(props: TopSongsProps) {
  const {
    id,
    initialSongs,
    category,
    lastInitialPage = ARTIST_LAST_INITIAL_PAGE,
    user,
    userFavorites,
    userPlaylists,
  } = props;

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: [id, "artists-top-songs", category ?? "popularity"],
      queryFn: async ({ pageParam }) => {
        const page = toArtistPage<Song>(
          await trpc.artist.songs.query({
            id,
            page: pageParam,
            cat: category,
            sort: categorySort(category),
          }),
          "topSongs",
          "songs",
        );
        return { ...page, items: page.items.map(toSongRow) };
      },
      initialPageParam: lastInitialPage + 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        nextArtistPage(lastPage, lastPageParam),
      initialData: {
        pages: [{ items: initialSongs, last_page: false }],
        pageParams: [lastInitialPage],
      },
    });

  return (
    <>
      <SongListClient
        items={uniqueBy(
          data.pages.flatMap((page) => page.items),
          (song) => song.id,
        )}
        user={user}
        userFavorites={userFavorites}
        userPlaylists={userPlaylists}
      />

      <LoadMore
        hasNextPage={hasNextPage}
        isFetching={isFetchingNextPage}
        onClick={() => void fetchNextPage()}
      />
    </>
  );
}

type TopAlbumsProps = Pick<
  ArtistsTopItemsProps,
  "id" | "category" | "lastInitialPage"
> & {
  initialAlbums: Album[];
};

function ArtistTopAlbums({
  id,
  initialAlbums,
  category,
  lastInitialPage = ARTIST_LAST_INITIAL_PAGE,
}: TopAlbumsProps) {
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: [id, "artists-top-albums", category ?? "popularity"],
      queryFn: async ({ pageParam }) =>
        toArtistPage<Album>(
          await trpc.artist.albums.query({
            id,
            page: pageParam,
            cat: category,
            sort: categorySort(category),
          }),
          "topAlbums",
          "albums",
        ),
      initialPageParam: lastInitialPage + 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        nextArtistPage(lastPage, lastPageParam),
      initialData: {
        pages: [{ items: initialAlbums, last_page: false }],
        pageParams: [lastInitialPage],
      },
    });

  return (
    <>
      <CatalogGrid>
        {uniqueBy(
          data.pages.flatMap((page) => page.items),
          (album) => album.id,
        ).map((album) => (
          <SliderCard
            key={album.id}
            name={album.title}
            url={album.perma_url}
            subtitle={album.subtitle}
            type={album.type}
            image={album.image}
            explicit={album.explicit_content}
          />
        ))}
      </CatalogGrid>

      <LoadMore
        hasNextPage={hasNextPage}
        isFetching={isFetchingNextPage}
        onClick={() => void fetchNextPage()}
      />
    </>
  );
}

/**
 * One tab's list with its own query. The Songs and Albums tabs are separate
 * routes in one client session and the query cache outlives both, so each tab
 * must only create its own query: a query a tab created for the other one
 * would be cached with empty initial data and show an empty list later.
 */
function ArtistsTopItemsContent(props: ArtistsTopItemsProps) {
  const { type, initialSongs, initialAlbums, ...rest } = props;

  return type === "songs" ? (
    <ArtistTopSongs {...rest} initialSongs={initialSongs ?? []} />
  ) : (
    <ArtistTopAlbums
      id={rest.id}
      category={rest.category}
      lastInitialPage={rest.lastInitialPage}
      initialAlbums={initialAlbums ?? []}
    />
  );
}

export function ArtistsTopItems(
  props: ComponentProps<typeof ArtistsTopItemsContent>,
) {
  return (
    <QueryScope>
      <ArtistsTopItemsContent {...props} />
    </QueryScope>
  );
}
