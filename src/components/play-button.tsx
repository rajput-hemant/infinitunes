"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { Episode, Song, Sort, Type } from "@/types";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import {
  getAlbumDetails,
  getArtistDetails,
  getEpisodeDetails,
  getLabelDetails,
  getMixDetails,
  getPlaylistDetails,
  getShowEpisodes,
  getSongDetails,
} from "@/lib/jiosaavn-api";
import { currentlyInDev } from "@/lib/utils";

type PlayButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  type: Type;
  token: string;
};

export function PlayButton(props: PlayButtonProps) {
  const { type, token, children, ...restProps } = props;

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [initialQueue, setQueue] = useQueue();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setCurrentIndex] = useCurrentSongIndex();

  const sort = (searchParams.get("sort") as Sort) ?? "desc";

  async function playHandler() {
    const songIndex = initialQueue.findIndex(
      (song) => token === song.url.split("/").pop()
    );

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
      return;
    } else {
      let queue: (Song | Episode)[] = [];

      switch (type) {
        case "song": {
          const songObj = await getSongDetails(token);
          queue = songObj.songs;
          break;
        }
        case "album": {
          const album = await getAlbumDetails(token);
          queue = album.songs ?? [];
          break;
        }
        case "playlist": {
          const playlist = await getPlaylistDetails(token);
          queue = playlist.songs ?? [];
          break;
        }
        case "mix": {
          const mix = await getMixDetails(token);
          queue = mix.songs ?? [];
          break;
        }
        case "artist": {
          const artist = await getArtistDetails(token);
          queue = artist.top_songs;
          break;
        }
        case "label": {
          const label = await getLabelDetails(token);
          queue = label.top_songs.songs;
          break;
        }
        case "show": {
          const episodes = await getShowEpisodes(
            token,
            +pathname.split("/")[3],
            1,
            sort
          );
          queue = episodes;
          break;
        }
        case "episode": {
          const data = await getEpisodeDetails(token);
          queue = data.episodes;
          break;
        }
        case "radio_station": {
          currentlyInDev();
          return;
        }
      }

      const _queue = queue.map(
        ({
          id,
          name,
          subtitle,
          type,
          url,
          image,
          download_url,
          artist_map: { artists },
          duration,
        }) => ({
          id,
          name,
          subtitle,
          url,
          type,
          image,
          download_url,
          artists,
          duration,
        })
      );

      setQueue(_queue);

      toast.success(
        `${queue.length} item${queue.length > 1 ? "s" : ""} has been added to the queue`,
        {
          description: `Playing "${queue[0].name}"`,
          position: "bottom-center",
        }
      );

      setCurrentIndex(0);
      setIsPlayerInit(true);
    }
  }

  return (
    <button aria-label="Play" onClick={playHandler} {...restProps}>
      {children}
    </button>
  );
}
