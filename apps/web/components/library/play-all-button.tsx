"use client";

import type { Episode, Song } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** Neutral toast title for a played list: episodes are tracks too. */
export function playAllToastTitle(count: number): string {
  return `${count} ${count === 1 ? "track" : "tracks"} added to the queue`;
}

type PlayAllButtonProps = {
  items: (Song | Episode)[];
  children?: ReactNode;
  className?: string;
};

export function PlayAllButton({
  items,
  children,
  className,
}: PlayAllButtonProps) {
  const [, setQueue] = useQueue();
  const [, setCurrentIndex] = useCurrentSongIndex();
  const [, setIsPlayerInit] = useIsPlayerInit();
  const [, setActiveRadio] = useActiveRadioSession();

  function playAll() {
    const queue = items.map(toQueue);
    if (!queue.length) return;

    setActiveRadio(null);
    setQueue(queue);
    setCurrentIndex(0);
    setIsPlayerInit(true);

    toast.success(playAllToastTitle(queue.length), {
      description: `Playing “${queue[0]?.name}”`,
      position: "bottom-center",
    });
  }

  return (
    <Button className={cn(controlStyles.text, className)} onClick={playAll}>
      {children ?? (
        <>
          <Play aria-hidden className="mr-1 size-4 fill-current" />
          Play All
        </>
      )}
    </Button>
  );
}
