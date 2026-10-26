"use client";

import type { SongRowItem } from "@infinitunes/types";
import { toQueueEntry } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Play } from "lucide-react";
import type { ReactNode } from "react";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
} from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type PlayAllButtonProps = {
  items: SongRowItem[];
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
    const queue = items.map(toQueueEntry);
    if (!queue.length) return;

    setActiveRadio(null);
    setQueue(queue);
    setCurrentIndex(0);
    setIsPlayerInit(true);
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
