"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Album, Category, Song } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useInfiniteQuery } from "@tanstack/react-query";

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

type Props = {
  id: string;
  type: "songs" | "albums";
  initialSongs?: Song[];
  initialAlbums?: Album[];
  category?: Category;
  user?: User;
  userFavorites?: Favorite | null;
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
    queryFn: async ({ pageParam }) =>
      toArtistPage<Song>(
        await utils.artist.songs.fetch({
          id,
          page: pageParam,
          cat: category,
          sort,
        }),
        "topSongs",
        "songs",
      ),
    initialPageParam: ARTIST_LAST_INITIAL_PAGE + 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      nextArtistPage(lastPage, lastPageParam),
    initialData: {
      pages: [{ items: initialSongs ?? [], last_page: false }],
      pageParams: [ARTIST_LAST_INITIAL_PAGE],
    },
  });

  const albumsResults = useInfiniteQuery({
    queryKey: [id, "artists-top-albums"],
    queryFn: async ({ pageParam }) =>
      toArtistPage<Album>(
        await utils.artist.albums.fetch({
          id,
          page: pageParam,
          cat: category,
          sort,
        }),
        "topAlbums",
        "albums",
      ),
    initialPageParam: ARTIST_LAST_INITIAL_PAGE + 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      nextArtistPage(lastPage, lastPageParam),
    initialData: {
      pages: [{ items: initialAlbums ?? [], last_page: false }],
      pageParams: [ARTIST_LAST_INITIAL_PAGE],
    },
  });

  const songs = songResults.data.pages.flatMap((page) => page.items);
  const albums = albumsResults.data.pages.flatMap((page) => page.items);

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
        {albums.map((album) => (
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
      </div>

      {hasNextPage ? (
        <Button
          variant="outline"
          className={cn(controlStyles.text, "mx-auto my-4 flex text-center")}
          onClick={clickHandler}
        >
          {isLoading ? "Loading..." : "Load More"}
        </Button>
      ) : (
        <h2 className="py-6 text-center font-heading text-xl dark:drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em>{" "}
          <span className="text-foreground">🤩</span>
        </h2>
      )}
    </>
  );
}
