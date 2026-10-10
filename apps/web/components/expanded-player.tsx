"use client";

import type { Queue } from "@infinitunes/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@infinitunes/ui/components/sheet";
import { ChevronDown } from "lucide-react";

import { GlassSurface } from "~/components/glass/glass-surface";
import type { PositionStore } from "~/lib/position-store";
import { cn } from "~/lib/utils";

import { ArtworkWash } from "./player/artwork-wash";
import { washGlassButtonClass } from "./player/controls";
import { ExpandedBody } from "./player/expanded-body";
import { useSwipe } from "./player/use-swipe";

// Distance a drag on the header must travel downward to dismiss the sheet.
const SWIPE_DOWN_PX = 80;

export type ExpandedPlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Queue | undefined;
  position: PositionStore;
  duration: number;
  isPlaying: boolean;
  isLoading: boolean;
  isLooping: boolean;
  loopPlaylist: boolean;
  isShuffle: boolean;
  isMuted: boolean;
  isReady: boolean;
  volume: number;
  onSeekStart: () => void;
  onSeekChange: (value: number) => void;
  onSeekCommit: () => void;
  onVolumeChange: (percent: number) => void;
  onToggleMute: () => void;
  onLoop: () => void;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
};

export function ExpandedPlayer({
  open,
  onOpenChange,
  track,
  ...body
}: ExpandedPlayerProps) {
  const swipe = useSwipe({
    direction: "down",
    distance: SWIPE_DOWN_PX,
    onSwipe: () => onOpenChange(false),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // Not a glass sheet: the layer is the page background lit by the
        // artwork, and only its two controls are glass. Another slot name
        // keeps the overlay glass rules (matched by `sheet-content`) off it.
        data-slot="expanded-player"
        className="max-h-dvh overflow-y-auto border-0 bg-background pb-[env(safe-area-inset-bottom)] text-foreground duration-slow ease-spring md:inset-0 md:h-dvh md:max-h-none md:justify-center"
      >
        {track && <ArtworkWash image={track.image} />}
        <SheetHeader
          className="relative min-h-14 flex-row items-center justify-center px-4 md:absolute md:inset-x-0 md:top-0"
          onTouchStart={swipe.onTouchStart}
          onTouchEnd={swipe.onTouchEnd}
        >
          <span
            aria-hidden
            className="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-fill-2 md:hidden"
          />
          <SheetClose
            render={
              <GlassSurface
                render={<button type="button" aria-label="Close" />}
                variant="clear"
                size="s"
                interactive
                className={cn(
                  washGlassButtonClass,
                  "absolute top-3 left-2 md:top-3 md:left-4",
                )}
              />
            }
          >
            <ChevronDown aria-hidden className="size-5" />
          </SheetClose>
          <SheetTitle>Now playing</SheetTitle>
          <SheetDescription className="sr-only">
            {track
              ? `${track.name}, ${track.subtitle}. Player controls and queue.`
              : "Player controls and queue."}
          </SheetDescription>
        </SheetHeader>
        {track && <ExpandedBody {...body} track={track} />}
      </SheetContent>
    </Sheet>
  );
}
