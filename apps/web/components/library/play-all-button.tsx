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

export function PlayAllButton({
  items,
  children,
  className,
}: {
  items: (Song | Episode)[];
  children?: ReactNode;
  className?: string;
}) {
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

    const trackLabel = queue.length === 1 ? "track" : "tracks";

    toast.success(`${queue.length} ${trackLabel} added to the queue`, {
      description: `Playing “${queue[0]?.name}”`,
      position: "bottom-center",
    });
  }

  return (
    <Button size="sm" className={className} onClick={playAll}>
      {children ?? (
        <>
          <Play aria-hidden className="mr-1 size-4 fill-current" />
          Play All
        </>
      )}
    </Button>
  );
}
