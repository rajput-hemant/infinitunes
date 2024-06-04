"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { User } from "next-auth";
import type { Favorite, MyPlaylist } from "@/lib/db/schema";
import type { Album, Category, Song } from "@/types";

import { SliderCard } from "@/components/slider";
import { SongListClient } from "@/components/song-list/song-list.client";
import { Button } from "@/components/ui/button";
import { getArtistsAlbums, getArtistsSongs } from "@/lib/jiosaavn-api";

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

  const songResults = useInfiniteQuery({
    queryKey: [id, type === "songs" ? "artists-top-songs" : null],
    queryFn: async ({ pageParam }) => {
      const songs = await getArtistsSongs(id, pageParam, category, sort);
      return songs.top_songs;
    },
    getNextPageParam: ({ last_page }, allPages) =>
      last_page ? null : allPages.length + 5,
    initialPageParam: 1,
    initialData: {
      pages: [{ songs: initialSongs, total: 0, last_page: false }],
      pageParams: [1],
    },
  });

  const albumsResults = useInfiniteQuery({
    queryKey: [id, type === "albums" ? "artists-top-albums" : null],
    queryFn: async ({ pageParam }) => {
      const albums = await getArtistsAlbums(id, pageParam, category, sort);
      return albums.top_albums;
    },
    getNextPageParam: ({ last_page }, allPages) =>
      last_page ? null : allPages.length + 2,
    initialPageParam: 1,
    initialData: {
      pages: [{ albums: initialAlbums, total: 0, last_page: false }],
      pageParams: [1],
    },
  });

  const songs = songResults.data.pages.flatMap((page) => page.songs ?? []);
  const albums = albumsResults.data.pages.flatMap((page) => page.albums ?? []);

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
        {albums.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <SliderCard
            key={id}
            name={name}
            url={url}
            subtitle={subtitle}
            type={type}
            image={image}
            explicit={explicit}
          />
        ))}
      </div>

      {hasNextPage ?
        <Button
          variant="outline"
          className="mx-auto my-4 flex rounded-full text-center"
          onClick={clickHandler}
        >
          {isLoading ? "Loading..." : "Load More"}
        </Button>
      : <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h3>
      }
    </>
  );
}
