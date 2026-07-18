"use client";

import { Pause, Play } from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import type { Type } from "@/types";

import { useCurrentSongIndex, useQueue } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { PlayButton } from "../play-button";

type TilePlayPauseButtonProps = {
  id: string;
  type: Type;
  token: string;
};

export function TilePlayPauseButton(props: TilePlayPauseButtonProps) {
  const { id, type, token } = props;
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const { playing, play, pause } = useGlobalAudioPlayer();

  const isCurrentSong = queue[currentIndex]?.id === id;
  const Icon = playing ? Pause : Play;

  return isCurrentSong ?
      <button
        onClick={playing ? pause : play}
        className="absolute inset-0 z-10 w-full bg-black/40 text-secondary dark:bg-black/75"
      >
        <Icon
          strokeWidth={playing ? 2 : 9}
          className={cn(
            "m-auto h-full w-6 p-1 duration-300 hover:w-8 dark:invert",
            playing && "p-0.5"
          )}
        />
      </button>
    : <PlayButton type={type} token={token}>
        <Play
          strokeWidth={9}
          className="absolute inset-0 z-20 m-auto hidden h-full w-6 p-1 text-secondary duration-300 hover:w-8 group-hover:block dark:invert"
        />
      </PlayButton>;
}
