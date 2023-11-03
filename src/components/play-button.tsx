"use client";

import React from "react";

import { Song, Type } from "@/types";
import {
  getAlbumDetails,
  getArtistDetails,
  getLabelDetails,
  getMixDetails,
  getPlaylistDetails,
  getSongDetails,
} from "@/lib/jiosaavn-api";
import { useConfig, useIsPlayerInit } from "@/hooks/use-config";

type Props = {
  type: Type;
  token: string;
  children: React.ReactNode;
} & React.HtmlHTMLAttributes<HTMLButtonElement>;

export function PlayButton({ type, token, children, ...props }: Props) {
  const [, setConfig] = useConfig();
  const [, setIsPlayerInit] = useIsPlayerInit();

  async function playHandler() {
    let queue: Song[] = [];

    if (type === "song") {
      const songObj = await getSongDetails(token);

      queue = songObj.songs;
    } else if (type === "album" || type === "playlist" || type === "mix") {
      let fetcher;

      if (type === "album") fetcher = getAlbumDetails;
      else if (type === "playlist") fetcher = getPlaylistDetails;
      else fetcher = getMixDetails;

      const album = await fetcher(token);
      queue = album.songs ?? [];
    } else if (type === "artist") {
      const artist = await getArtistDetails(token);
      queue = artist.top_songs;
    } else if (type === "label") {
      const label = await getLabelDetails(token);
      queue = label.top_songs.songs;
    } else if (type === "episode" || type === "show") {
      // const result =
      //   type === "episode"
      //     ? await getEpisodeDetails(token)
      //     : getShowDetails(token);
      // queue = result.episodes ?? [];
    }
    setConfig((config) => ({
      ...config,
      queue: queue.map(
        ({
          id,
          name,
          subtitle,
          url,
          image,
          download_url,
          artist_map: { artists },
        }) => ({
          id,
          name,
          subtitle,
          url,
          image,
          download_url,
          artists,
        })
      ),
    }));
    setIsPlayerInit(true);
  }

  return (
    <button onClick={playHandler} {...props}>
      {children}
    </button>
  );
}
