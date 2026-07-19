"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import { Button } from "@infinitunes/ui/components/button";
import { useInfiniteQuery } from "@tanstack/react-query";

import { SliderCard } from "~/components/slider";
import { SongListClient } from "~/components/song-list/song-list.client";
import { api } from "~/lib/trpc/client";
import type { Album, Category, Song } from "~/types";
import type { User } from "~/types/user";

type Props = {
  id: string;
  type: "songs" | "albums";
  initialSongs?: Song[];
  initialAlbums?: Album[];
  category?: Category;
  user?: User;
  userFavorites?: Favorite;
  userPlaylists?: MyPlaylist[];
};

export function ArtistsTopItems(props: Props) {
  const {
    id,
    type,
    initialSongs,
    initialAlbums,
    category,
    user,
    userFavorites,
    userPlaylists,
  } = props;

  const sort = category === "latest" ? "desc" : "asc";

  const utils = api.useUtils();

  const songResults = useInfiniteQuery({
    queryKey: [id, "artists-top-songs"],
    queryFn: ({ pageParam }) =>
      utils.artist.songs.fetch({
        id,
        page: pageParam,
        cat: category,
        sort,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage, allPages) =>
      (lastPage as { last_page: boolean }).last_page
        ? null
        : allPages.length + 5,
    initialData: {
      pages: [{ songs: initialSongs ?? [], total: 0, last_page: false }],
      pageParams: [1],
    },
  });

  const albumsResults = useInfiniteQuery({
    queryKey: [id, "artists-top-albums"],
    queryFn: ({ pageParam }) =>
      utils.artist.albums.fetch({
        id,
        page: pageParam,
        cat: category,
        sort,
      }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage, allPages) =>
      (lastPage as { last_page: boolean }).last_page
        ? null
        : allPages.length + 2,
    initialData: {
      pages: [{ albums: initialAlbums ?? [], total: 0, last_page: false }],
      pageParams: [1],
    },
  });

  const songs = songResults.data.pages.flatMap(
    (page) => (page as { songs?: Song[] }).songs ?? [],
  );
  const albums = albumsResults.data.pages.flatMap(
    (page) => (page as { albums?: Album[] }).albums ?? [],
  );

  const hasNextPage = songResults.hasNextPage || albumsResults.hasNextPage;
  const isLoading =
    songResults.isFetchingNextPage || albumsResults.isFetchingNextPage;

  const clickHandler = () => {
    if (type === "songs") {
      songResults.fetchNextPage();
    } else if (type === "albums") {
      albumsResults.fetchNextPage();
    }
  };

  return (
    <>
      <SongListClient
        items={songs}
        user={user}
        userFavorites={userFavorites}
        userPlaylists={userPlaylists}
      />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {albums.map(
          ({
            id,
            title,
            perma_url,
            subtitle,
            type,
            image,
            explicit_content,
          }) => (
            <SliderCard
              key={id}
              title={title}
              perma_url={perma_url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit_content}
            />
          ),
        )}
      </div>

      {hasNextPage ? (
        <Button
          variant="outline"
          className="mx-auto my-4 flex rounded-full text-center"
          onClick={clickHandler}
        >
          {isLoading ? "Loading..." : "Load More"}
        </Button>
      ) : (
        <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      )}
    </>
  );
}
