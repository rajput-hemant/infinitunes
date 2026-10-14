"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Album, Category, Song } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useInfiniteQuery } from "@tanstack/react-query";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { SliderCard } from "~/components/slider/slider-card";
import { SongListClient } from "~/components/song-list/song-list.client";
import {
  ARTIST_LAST_INITIAL_PAGE,
  nextArtistPage,
  toArtistPage,
} from "~/lib/artist-pagination";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { api } from "~/lib/trpc/client";
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
  initialSongs?: Song[];
  initialAlbums?: Album[];
  category?: Category;
  user?: User;
  userFavorites?: Favorite | null;
  userPlaylists?: MyPlaylist[];
};

type TopSongsProps = Pick<
  ArtistsTopItemsProps,
  "id" | "category" | "user" | "userFavorites" | "userPlaylists"
> & { initialSongs: Song[] };

function ArtistTopSongs(props: TopSongsProps) {
  const { id, initialSongs, category, user, userFavorites, userPlaylists } =
    props;

  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: [id, "artists-top-songs"],
      queryFn: async ({ pageParam }) =>
        toArtistPage<Song>(
          await utils.artist.songs.fetch({
            id,
            page: pageParam,
            cat: category,
            sort: category === "latest" ? "desc" : "asc",
          }),
          "topSongs",
          "songs",
        ),
      initialPageParam: ARTIST_LAST_INITIAL_PAGE + 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        nextArtistPage(lastPage, lastPageParam),
      initialData: {
        pages: [{ items: initialSongs, last_page: false }],
        pageParams: [ARTIST_LAST_INITIAL_PAGE],
      },
    });

  return (
    <>
      <SongListClient
        items={data.pages.flatMap((page) => page.items)}
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

type TopAlbumsProps = Pick<ArtistsTopItemsProps, "id" | "category"> & {
  initialAlbums: Album[];
};

function ArtistTopAlbums({ id, initialAlbums, category }: TopAlbumsProps) {
  const utils = api.useUtils();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: [id, "artists-top-albums"],
      queryFn: async ({ pageParam }) =>
        toArtistPage<Album>(
          await utils.artist.albums.fetch({
            id,
            page: pageParam,
            cat: category,
            sort: category === "latest" ? "desc" : "asc",
          }),
          "topAlbums",
          "albums",
        ),
      initialPageParam: ARTIST_LAST_INITIAL_PAGE + 1,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        nextArtistPage(lastPage, lastPageParam),
      initialData: {
        pages: [{ items: initialAlbums, last_page: false }],
        pageParams: [ARTIST_LAST_INITIAL_PAGE],
      },
    });

  return (
    <>
      <CatalogGrid>
        {data.pages
          .flatMap((page) => page.items)
          .map((album) => (
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
export function ArtistsTopItems(props: ArtistsTopItemsProps) {
  const { type, initialSongs, initialAlbums, ...rest } = props;

  return type === "songs" ? (
    <ArtistTopSongs {...rest} initialSongs={initialSongs ?? []} />
  ) : (
    <ArtistTopAlbums
      id={rest.id}
      category={rest.category}
      initialAlbums={initialAlbums ?? []}
    />
  );
}
