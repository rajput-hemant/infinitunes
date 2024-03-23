"use client";

import React from "react";

import type { Song, Type } from "@/types";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "@/hooks/use-store";
import {
  getAlbumDetails,
  getArtistDetails,
  getLabelDetails,
  getMixDetails,
  getPlaylistDetails,
  getSongDetails,
} from "@/lib/jiosaavn-api";
import { currentlyInDev } from "@/lib/utils";

type PlayButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  type: Type;
  token: string;
};

export function PlayButton(props: PlayButtonProps) {
  const { type, token, children, ...restProps } = props;

  const [initialQueue, setQueue] = useQueue();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setCurrentIndex] = useCurrentSongIndex();

  async function playHandler() {
    const songIndex = initialQueue.findIndex(
      (song) => token === song.url.split("/").pop()
    );

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
      return;
    } else {
      let queue: Song[] = [];

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
        case "episode":
        case "show":
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
        }) => ({
          id,
          name,
          subtitle,
          url,
          type,
          image,
          download_url,
          artists,
        })
      );

      setQueue(_queue);

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
