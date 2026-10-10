"use client";

import { getImageSrc } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { X } from "lucide-react";
import * as React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { QueueList } from "~/components/player/queue-list";
import { useIsWide } from "~/components/player/use-queue-pane";
import { useKeydown } from "~/hooks/use-keydown";
import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

type QueueProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const sectionLabel =
  "flex items-center justify-between px-2 pt-3 pb-1 text-[0.6875rem]/4 font-semibold tracking-[0.06em] text-muted-foreground uppercase";

export function Queue({ open, onOpenChange }: QueueProps) {
  const docked = useIsWide();
  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const current = queue[currentIndex];
  const upNext = queue.length - currentIndex - 1;

  // Rows mount on first open, so a closed pane costs nothing, and stay
  // mounted afterwards so the exit transition keeps its content.
  const [hasOpened, setHasOpened] = React.useState(open);
  if (open && !hasOpened) setHasOpened(true);

  const paneRef = React.useRef<HTMLElement>(null);
  useKeydown((event) => {
    if (
      event.key === "Escape" &&
      event.target instanceof Node &&
      paneRef.current?.contains(event.target)
    ) {
      onOpenChange(false);
    }
  });

  function clearUpNext() {
    setQueue(queue.slice(0, currentIndex + 1));
    setCurrentIndex(currentIndex);
  }

  return (
    <GlassSurface
      ref={paneRef}
      render={<aside id="player-queue" aria-label="Queue" />}
      // The docked pane is a full-height column (blur only, no lens); the
      // floating one is a menu-weight panel that morphs out of the player.
      size={docked ? "xl" : "l"}
      glassRole="queue"
      data-state={open ? "open" : "closed"}
      inert={!open}
      className={cn(
        "fixed z-45 flex flex-col overflow-hidden rounded-lg transition-[opacity,translate,visibility] duration-base ease-spring",
        "right-3 bottom-[calc(9.75rem+env(safe-area-inset-bottom))] left-3 h-[min(28rem,calc(100dvh-12rem))]",
        "md:bottom-23 md:left-auto md:h-[min(34rem,calc(100dvh-7.5rem))] md:w-[min(22rem,calc(100vw-1.5rem))]",
        // Concentric with the 0.5rem inset: sidebar radius (lg + 6px), and the
        // column is the shell's `--queue-w` minus the inset on its outer edge.
        "min-[1440px]:inset-y-2 min-[1440px]:right-2 min-[1440px]:h-auto min-[1440px]:w-[calc(var(--queue-w)-0.5rem)] min-[1440px]:rounded-[calc(var(--radius-lg)+0.375rem)]",
        open
          ? "visible opacity-100"
          : "invisible opacity-0 min-[1440px]:translate-x-full",
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between pr-3 pl-5">
        <h2 className="text-sm/5 font-bold text-foreground">
          Queue{" "}
          <span className="font-normal text-muted-foreground">
            {queue.length} {queue.length === 1 ? "Track" : "Tracks"}
          </span>
        </h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close queue"
          onClick={() => onOpenChange(false)}
          className={controlStyles.headerIcon}
        >
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      {hasOpened && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 min-[1440px]:pb-28">
          {current && (
            <div className="hidden px-2 pb-4 min-[1440px]:block">
              <div className="relative aspect-square overflow-hidden rounded-md">
                <ImageWithFallback
                  src={getImageSrc(current.image, "high")}
                  alt=""
                  fill
                  sizes="320px"
                  fallback={getPlaceholderSrc("song")}
                  className="object-cover"
                />
                <Skeleton className="absolute inset-0 -z-10" />
              </div>
            </div>
          )}
          {current && (
            <>
              <h3 className={sectionLabel}>Now playing</h3>
              <div className="px-2 py-1">
                <p className="truncate text-[0.8125rem]/5 font-medium text-foreground">
                  {current.name}
                </p>
                <p className="truncate text-xs/4 text-muted-foreground">
                  {current.subtitle}
                </p>
              </div>
            </>
          )}
          <h3 className={sectionLabel}>
            Up next
            {upNext > 0 && (
              <button
                type="button"
                onClick={clearUpNext}
                className="rounded-sm text-[0.8125rem]/5 font-semibold tracking-normal text-primary normal-case"
              >
                Clear
              </button>
            )}
          </h3>
          <QueueList upNextOnly />
          {upNext === 0 && (
            <p className="px-2 text-sm text-muted-foreground">
              Nothing queued. Autoplay continues with similar songs.
            </p>
          )}
        </div>
      )}
    </GlassSurface>
  );
}
