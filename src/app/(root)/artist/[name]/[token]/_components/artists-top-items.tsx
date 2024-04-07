"use client";

import { useEffect, useState } from "react";

import type { User } from "next-auth";
import type { Favorite, MyPlaylist } from "@/lib/db/schema";
import type { Album, Category, Song } from "@/types";

import { SliderCard } from "@/components/slider";
import { SongListClient } from "@/components/song-list/song-list.client";
import { Button } from "@/components/ui/button";
import { getArtistsAlbums, getArtistsSongs } from "@/lib/jiosaavn-api";

type ArtistsTopItemsProps = {
  id: string;
  type: "songs" | "albums";
  initialSongs?: Song[];
  initialAlbums?: Album[];
  category?: Category;
  user?: User;
  userFavorites?: Favorite;
  userPlaylists?: MyPlaylist[];
};

export function ArtistsTopItems(props: ArtistsTopItemsProps) {
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

  const [songs, setSongs] = useState(initialSongs ?? []);
  const [albums, setAlbums] = useState(initialAlbums ?? []);
  const [page, setPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (category === undefined) return;

    const sort = category === "latest" ? "desc" : "asc";

    if (type === "songs") {
      (async () => {
        const songs = await getArtistsSongs(id, 0, category, sort);
        setSongs(songs.top_songs.songs);
        setHasMore(!songs.top_songs.last_page);
      })();
    }

    if (type === "albums") {
      (async () => {
        const albums = await getArtistsAlbums(id, 0, category, sort);
        setAlbums(albums.top_albums.albums);
        setHasMore(!albums.top_albums.last_page);
      })();
    }
  }, [id, type, category]);

  async function clickHandler() {
    setIsLoading(true);

    const nextPage = page + 1;

    if (type === "songs") {
      const songs = await getArtistsSongs(id, nextPage, category);
      setSongs((s) => [...s, ...songs.top_songs.songs]);
      setHasMore(!songs.top_songs.last_page);
    }

    if (type === "albums") {
      const albums = await getArtistsAlbums(id, nextPage, category);
      setAlbums((a) => [...a, ...albums.top_albums.albums]);
      setHasMore(!albums.top_albums.last_page);
    }

    setPage(nextPage);
    setIsLoading(false);
  }

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

      {hasMore ?
        <Button
          variant="outline"
          className="mx-auto my-4 flex rounded-full text-center"
          onClick={clickHandler}
        >
          {isLoading ? "Loading..." : "Load More"}
        </Button>
      : <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
          <em>Yay! You have seen it all</em> 🤩
        </h3>
      }
    </>
  );
}
