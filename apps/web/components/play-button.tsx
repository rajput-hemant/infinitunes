"use client";

import type { Episode, Song, Sort, MediaType } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { useSearchParams } from "next/navigation";
import type { HTMLAttributes } from "react";
import { toast } from "sonner";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { findQueueIndex } from "~/lib/queue-position";
import { api } from "~/lib/trpc/client";

type PlayButtonProps = HTMLAttributes<HTMLButtonElement> & {
  type: MediaType;
  token: string;
  /** Season to queue when `type` is "show"; the first season when omitted. */
  season?: number;
  /** Set when the button sits on a queue row: jump to that exact entry. */
  queueItemId?: string;
  /** Queue the source in a random order and start from its first entry. */
  shuffle?: boolean;
};

function parseSort(value: string | null): Sort {
  return value === "asc" ? "asc" : "desc";
}

/** Every item once, in random order (sorting by a random key per item). */
function shuffled<T>(items: T[]): T[] {
  return items
    .map((item) => ({ item, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

export function PlayButton(props: PlayButtonProps) {
  const {
    type,
    token,
    season,
    queueItemId,
    shuffle = false,
    children,
    ...restProps
  } = props;

  const searchParams = useSearchParams();

  const [initialQueue, setQueue] = useQueue();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setActiveRadio] = useActiveRadioSession();

  const utils = api.useUtils();

  const sort = parseSort(searchParams.get("sort"));

  async function playHandler() {
    const songIndex = shuffle
      ? -1
      : findQueueIndex(initialQueue, { token, queueItemId });

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

      const ordered = shuffle ? shuffled(queue) : queue;
      const queueItems = ordered.map((item) => toQueue(item));
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
      aria-label={shuffle ? "Shuffle" : "Play"}
      onClick={playHandler}
      {...restProps}
    >
      {children}
    </button>
  );
}
