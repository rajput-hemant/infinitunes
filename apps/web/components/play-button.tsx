"use client";

import type { Episode, Song, Sort, MediaType } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { findQueueIndex } from "~/lib/queue-position";
import { api } from "~/lib/trpc/client";

type PlayButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  type: MediaType;
  token: string;
  /** Season to queue when `type` is "show"; the first season when omitted. */
  season?: number;
  /** Set when the button sits on a queue row: jump to that exact entry. */
  queueItemId?: string;
};

export function PlayButton(props: PlayButtonProps) {
  const { type, token, season, queueItemId, children, ...restProps } = props;

  const searchParams = useSearchParams();

  const [initialQueue, setQueue] = useQueue();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setActiveRadio] = useActiveRadioSession();

  const utils = api.useUtils();

  const sort = (searchParams.get("sort") as Sort) ?? "desc";

  async function playHandler() {
    const songIndex = findQueueIndex(initialQueue, { token, queueItemId });

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
      return;
    } else {
      let queue: (Song | Episode)[] = [];
      let isRadio = false;

      switch (type) {
        case "song": {
          const songObj = await utils.song.details.fetch({ token });
          queue = songObj.songs;
          break;
        }
        case "album": {
          const album = await utils.album.details.fetch({ token });
          queue = Array.isArray(album.list) ? album.list : [];
          break;
        }
        case "playlist": {
          const playlist = await utils.playlist.details.fetch({ token });
          queue = Array.isArray(playlist.list) ? playlist.list : [];
          break;
        }
        case "mix": {
          const mix = await utils.get.mix.fetch({ token });
          queue = Array.isArray(mix.list) ? mix.list : [];
          break;
        }
        case "artist": {
          const artist = await utils.artist.details.fetch({ token });
          queue = artist.topSongs ?? [];
          break;
        }
        case "label": {
          const label = await utils.get.label.fetch({ token });
          queue = label.topSongs.songs;
          break;
        }
        case "show": {
          queue = await utils.show.episodes.fetch({
            id: token,
            season,
            page: 1,
            sort,
          });
          break;
        }
        case "episode": {
          const data = await utils.show.episodeDetails.fetch({
            token,
            sort,
          });
          queue = data.episodes;
          break;
        }
        case "radio_station": {
          isRadio = true;
          try {
            const details = await utils.radio.stationDetails.fetch({ token });
            if (!details.songs.length) {
              toast.error("No songs found for this radio station");
              return;
            }
            queue = details.songs;
            setActiveRadio({
              stationId: details.stationId,
              name: details.station.title,
              type: "featured",
              language: details.station.more_info.language,
            });
          } catch {
            toast.error("Failed to load radio station");
            return;
          }
          break;
        }
      }

      if (!isRadio) {
        setActiveRadio(null);
      }

      const queueItems = queue.map((item) => toQueue(item));
      const first = queueItems[0];
      if (!first) return;

      setQueue(queueItems);

      toast.success(
        `${queueItems.length} item${queueItems.length === 1 ? "" : "s"} ${queueItems.length === 1 ? "has" : "have"} been added to the queue`,
        {
          description: `Playing "${first.name}"`,
          position: "bottom-center",
        },
      );

      setCurrentIndex(0);
      setIsPlayerInit(true);
    }
  }

  return (
    <button
      type="button"
      aria-label="Play"
      onClick={playHandler}
      {...restProps}
    >
      {children}
    </button>
  );
}
