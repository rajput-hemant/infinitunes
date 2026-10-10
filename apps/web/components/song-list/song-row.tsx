"use client";

import type { ReactNode } from "react";
import { useAudioPlayerContext } from "react-use-audio-player";

import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { isCurrentTrack } from "~/lib/queue-position";

type SongRowProps = {
  id: string;
  className?: string;
  children: ReactNode;
};

/** Row shell that exposes the playing state to its server-rendered cells as `data-current` and `data-playing`. */
export function SongRow(props: SongRowProps) {
  const { id, className, children } = props;
  const [queue] = useQueue();
  const [currentIndex] = useCurrentSongIndex();
  const { isPlaying } = useAudioPlayerContext();

  const isCurrent = isCurrentTrack(queue, currentIndex, { id });

  return (
    <div
      data-current={isCurrent || undefined}
      data-playing={(isCurrent && isPlaying) || undefined}
      className={className}
    >
      {children}
    </div>
  );
}
