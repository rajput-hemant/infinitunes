"use client";

import type {
  Album,
  Artist,
  Episode,
  EpisodeDetail,
  Label,
  Mix,
  Playlist,
  Song,
  SongObj,
  Sort,
  MediaType,
} from "@infinitunes/types";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { api } from "~/lib/trpc/client";
import { currentlyInDev, getToken, toQueue } from "~/lib/utils";

type PlayButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  type: MediaType;
  token: string;
};

export function PlayButton(props: PlayButtonProps) {
  const { type, token, children, ...restProps } = props;

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [initialQueue, setQueue] = useQueue();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setCurrentIndex] = useCurrentSongIndex();

  const utils = api.useUtils();

  const sort = (searchParams.get("sort") as Sort) ?? "desc";

  async function playHandler() {
    const songIndex = initialQueue.findIndex(
      (song) => token === getToken(song.url),
    );

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
      return;
    } else {
      let queue: (Song | Episode)[] = [];

      switch (type) {
        case "song": {
          const songObj = (await utils.song.details.fetch({
            token,
          })) as unknown as SongObj;
          queue = songObj.songs;
          break;
        }
        case "album": {
          const album = (await utils.album.details.fetch({
            token,
          })) as unknown as Album;
          queue = Array.isArray(album.list) ? album.list : [];
          break;
        }
        case "playlist": {
          const playlist = (await utils.playlist.details.fetch({
            token,
          })) as unknown as Playlist;
          queue = Array.isArray(playlist.list) ? playlist.list : [];
          break;
        }
        case "mix": {
          const mix = (await utils.get.mix.fetch({
            token,
          })) as unknown as Mix;
          queue = Array.isArray(mix.list) ? mix.list : [];
          break;
        }
        case "artist": {
          const artist = (await utils.artist.details.fetch({
            token,
          })) as unknown as Artist;
          queue = artist.topSongs ?? [];
          break;
        }
        case "label": {
          const label = (await utils.get.label.fetch({
            token,
          })) as unknown as Label;
          queue = label.topSongs.songs;
          break;
        }
        case "show": {
          const episodes = (await utils.show.episodes.fetch({
            id: token,
            season: +pathname.split("/")[3],
            page: 1,
            sort,
          })) as unknown as Episode[];
          queue = episodes;
          break;
        }
        case "episode": {
          const data = (await utils.show.episodeDetails.fetch({
            token,
            sort,
          })) as unknown as EpisodeDetail;
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
          description: `Playing "${_queue[0].name}"`,
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
