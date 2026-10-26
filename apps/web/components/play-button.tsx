"use client";

import { shuffled } from "@infinitunes/core/playback-order";
import { findQueueIndex } from "@infinitunes/core/queue-position";
import type { Episode, Song, Sort, MediaType } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { useState, type HTMLAttributes } from "react";
import { useAudioPlayerContext } from "react-use-audio-player";
import { toast } from "sonner";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { trpc } from "~/lib/trpc/vanilla";

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

/**
 * Read at click time, not with `useSearchParams()`: that hook suspends while a
 * route is prerendered, and every play control (hero, cards, rows) would push
 * its page out of the static shell for a `sort` only show/episode pages read.
 */
function currentSort(): Sort {
  return new URLSearchParams(window.location.search).get("sort") === "asc"
    ? "asc"
    : "desc";
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

  const [initialQueue, setQueue] = useQueue();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [, setActiveRadio] = useActiveRadioSession();
  const { isPlaying, play } = useAudioPlayerContext();

  const [pending, setPending] = useState(false);

  async function playHandler() {
    const sort = currentSort();
    const songIndex = shuffle
      ? -1
      : findQueueIndex(initialQueue, { token, queueItemId });

    if (songIndex !== -1) {
      setCurrentIndex(songIndex);
      setIsPlayerInit(true);
      if (isPlayerInit && songIndex === currentIndex && !isPlaying) play();
      return;
    } else {
      let queue: (Song | Episode)[] = [];
      let isRadio = false;

      try {
        switch (type) {
          case "song": {
            const songObj = await trpc.song.details.query({ token });
            queue = songObj.songs;
            break;
          }
          case "album": {
            const album = await trpc.album.details.query({ token });
            queue = Array.isArray(album.list) ? album.list : [];
            break;
          }
          case "playlist": {
            const playlist = await trpc.playlist.details.query({ token });
            queue = Array.isArray(playlist.list) ? playlist.list : [];
            break;
          }
          case "mix": {
            const mix = await trpc.get.mix.query({ token });
            queue = Array.isArray(mix.list) ? mix.list : [];
            break;
          }
          case "artist": {
            const artist = await trpc.artist.details.query({ token });
            queue = artist.topSongs ?? [];
            break;
          }
          case "label": {
            const label = await trpc.get.label.query({ token });
            queue = label.topSongs.songs;
            break;
          }
          case "show": {
            // By perma token, like every other type: `show.episodes` wants
            // the numeric show id and answers a token with no episodes.
            const show = await trpc.show.details.query({ token, season, sort });
            queue = show.episodes;
            break;
          }
          case "episode": {
            const data = await trpc.show.episodeDetails.query({
              token,
              sort,
            });
            queue = data.episodes;
            break;
          }
          case "radio_station": {
            isRadio = true;
            try {
              const details = await trpc.radio.stationDetails.query({ token });
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
      } catch {
        toast.error("Couldn't load songs");
        return;
      }

      if (!isRadio) {
        setActiveRadio(null);
      }

      const ordered = shuffle ? shuffled(queue) : queue;
      const queueItems = ordered.map((item) => toQueue(item));
      const first = queueItems[0];
      if (!first) {
        toast.error("Nothing to play here yet.");
        return;
      }

      // No success toast: the player bar already announces what plays.
      setQueue(queueItems);

      setCurrentIndex(0);
      setIsPlayerInit(true);
    }
  }

  return (
    <button
      type="button"
      aria-label={shuffle ? "Shuffle" : "Play"}
      aria-busy={pending || undefined}
      data-pending={pending || undefined}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        try {
          await playHandler();
        } finally {
          setPending(false);
        }
      }}
      {...restProps}
    >
      {children}
    </button>
  );
}
