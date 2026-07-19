"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import {
  getAlbumDetails,
  getArtistDetails,
  getEpisodeDetails,
  getLabelDetails,
  getMixDetails,
  getPlaylistDetails,
  getShowEpisodes,
  getSongDetails,
} from "~/lib/jiosaavn-api";
import { currentlyInDev, toQueue } from "~/lib/utils";
import type { Episode, Song, Sort, Type } from "~/types";

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
      (song) => token === song.perma_url.split("/").pop(),
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
          queue = Array.isArray(album.list) ? album.list : [];
          break;
        }
        case "playlist": {
          const playlist = await getPlaylistDetails(token);
          queue = Array.isArray(playlist.list) ? playlist.list : [];
          break;
        }
        case "mix": {
          const mix = await getMixDetails(token);
          queue = Array.isArray(mix.list) ? mix.list : [];
          break;
        }
        case "artist": {
          const artist = await getArtistDetails(token);
          queue = artist.topSongs ?? [];
          break;
        }
        case "label": {
          const label = await getLabelDetails(token);
          queue = label.topSongs.songs;
          break;
        }
        case "show": {
          const episodes = await getShowEpisodes(
            token,
            +pathname.split("/")[3],
            1,
            sort,
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

      const _queue = queue.map((item) => toQueue(item));

      setQueue(_queue);

      toast.success(
        `${queue.length} item${queue.length > 1 ? "s" : ""} has been added to the queue`,
        {
          description: `Playing "${queue[0].title}"`,
          position: "bottom-center",
        },
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
