"use client";

import type { MediaType } from "@infinitunes/types";
import { Pause, Play } from "lucide-react";
import { useAudioPlayerContext } from "react-use-audio-player";

import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { isCurrentTrack } from "~/lib/queue-position";
import { cn } from "~/lib/utils";

import { PlayButton } from "../play-button";

type TilePlayPauseButtonProps = {
  id: string;
  type: MediaType;
  token: string;
  /** Set when this row is itself a queue entry, so duplicates stay distinct. */
  queueItemId?: string;
};

export function TilePlayPauseButton(props: TilePlayPauseButtonProps) {
  const { id, type, token, queueItemId } = props;
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const { isPlaying, play, pause } = useAudioPlayerContext();

  const isCurrentSong = isCurrentTrack(queue, currentIndex, {
    id,
    queueItemId,
  });
  const Icon = isPlaying ? Pause : Play;

  return isCurrentSong ? (
    <button
      type="button"
      aria-label={isPlaying ? "Pause" : "Play"}
      onClick={isPlaying ? pause : play}
      // Image scrim: must stay dark over arbitrary artwork in both themes, so
      // it is deliberately not a theme token.
      className="absolute inset-0 z-10 w-full bg-black/40 text-secondary outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring dark:bg-black/75"
    >
      <Icon
        aria-hidden="true"
        strokeWidth={isPlaying ? 2 : 9}
        className={cn(
          "m-auto h-full w-6 p-1 transition-transform duration-150 ease-out hover:scale-125 dark:invert",
          isPlaying && "p-0.5",
        )}
      />
    </button>
  ) : (
    <PlayButton
      type={type}
      token={token}
      queueItemId={queueItemId}
      className="absolute inset-0 z-20 outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <Play
        aria-hidden="true"
        strokeWidth={9}
        className="absolute inset-0 z-20 m-auto hidden h-full w-6 p-1 text-secondary transition-transform duration-150 ease-out hover:scale-125 group-focus-within:block group-hover:block dark:invert"
      />
    </PlayButton>
  );
}
