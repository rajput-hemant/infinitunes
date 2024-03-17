"use client";

import { useEffect, useState } from "react";

import type { Album, Category, Song } from "@/types";

import { ItemCard } from "@/components/item-card";
import { SongList } from "@/components/song/song-list";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/topography";
import { getArtistsAlbums, getArtistsSongs } from "@/lib/jiosaavn-api";

type Props = {
  id: string;
  type: "songs" | "albums";
  initialSongs?: Song[];
  initialAlbums?: Album[];
  category?: Category;
};

const ArtistsTopItems = ({
  id,
  type,
  initialSongs,
  initialAlbums,
  category,
}: Props) => {
  const [songs, setSongs] = useState(initialSongs ?? []);
  const [albums, setAlbums] = useState(initialAlbums ?? []);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (category === undefined) return;

    if (type === "songs") {
      (async () => {
        const songs = await getArtistsSongs(id, 0, category);
        setSongs(songs.top_songs.songs);
        setHasMore(!songs.top_songs.last_page);
      })();
    }

    if (type === "albums") {
      (async () => {
        const albums = await getArtistsAlbums(id, 0, category);
        setAlbums(albums.top_albums.albums);
        setHasMore(!albums.top_albums.last_page);
      })();
    }
  }, [id, type, category]);

  async function clickHandler() {
    setIsLoading(true);

    setPage((page) => page + 1);

    if (type === "songs") {
      const songs = await getArtistsSongs(id, page, category);
      setSongs((s) => [...s, ...songs.top_songs.songs]);
      setHasMore(!songs.top_songs.last_page);
    }

    if (type === "albums") {
      const albums = await getArtistsAlbums(id, page, category);
      setAlbums((a) => [...a, ...albums.top_albums.albums]);
      setHasMore(!albums.top_albums.last_page);
    }

    setIsLoading(false);
  }

  return (
    <>
      <SongList items={songs} />

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {albums.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <ItemCard
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
      : <H3 className="text-center">
          <em>Yay! You have seen it all</em> 🤩
        </H3>
      }
    </>
  );
};

export default ArtistsTopItems;
