"use client";

import { formatDuration, getImageSrc } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@infinitunes/ui/components/sheet";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Slider } from "@infinitunes/ui/components/slider";
import {
  Loader2,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import React from "react";

import { cn } from "~/lib/utils";

import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { QueueList } from "./queue";

/** Sets `aria-valuetext` on the range input inside a Base UI slider root. */
export function setValueText(root: HTMLElement | null, text: string) {
  root
    ?.querySelector("input[type=range]")
    ?.setAttribute("aria-valuetext", text);
}

// 44px minimum touch target.
const buttonClass =
  "flex size-11 shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

// The slider control is only as tall as its thumb; stretch it to 44px.
const sliderBandClass = "[&>div]:min-h-11";

type ExpandedPlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Queue | undefined;
  pos: number;
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

/**
 * Bottom sheet opened from the player bar below `lg`. Holds the controls the
 * compact bar hides (loop, shuffle, volume, queue); all state and handlers
 * come from the player so the bar and the sheet never diverge.
 */
export function ExpandedPlayer(props: ExpandedPlayerProps) {
  const { open, onOpenChange, track } = props;

  // Close when the viewport grows to the desktop layout, where this sheet has
  // no trigger and the bar shows every control itself.
  React.useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) onOpenChange(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[92dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)] motion-reduce:transition-none lg:hidden"
      >
        <SheetHeader>
          <SheetTitle>Now playing</SheetTitle>
          <SheetDescription className="sr-only">
            {track
              ? `${track.name}, ${track.subtitle}. Player controls and queue.`
              : "Player controls and queue."}
          </SheetDescription>
        </SheetHeader>
        {track && <ExpandedBody {...props} track={track} />}
        <SheetClose
          aria-label="Close"
          className={cn(buttonClass, "absolute top-1 right-3 hover:bg-muted")}
        >
          <X aria-hidden className="size-5" />
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}

function ExpandedBody(props: ExpandedPlayerProps & { track: Queue }) {
  const {
    track,
    pos,
    duration,
    isPlaying,
    isLoading,
    isLooping,
    loopPlaylist,
    isShuffle,
    isMuted,
    isReady,
    volume,
  } = props;

  const seekLabelId = React.useId();
  const volumeLabelId = React.useId();
  const queueHeadingId = React.useId();
  const seekRef = React.useRef<HTMLDivElement>(null);
  const volumeRef = React.useRef<HTMLDivElement>(null);

  const format = duration >= 3600 ? "hh:mm:ss" : "mm:ss";
  const seekText = `${formatDuration(pos, format)} of ${formatDuration(duration, format)}`;
  const volumeText = `${isMuted ? 0 : Math.round(volume * 100)} percent`;

  React.useEffect(() => setValueText(seekRef.current, seekText), [seekText]);
  React.useEffect(
    () => setValueText(volumeRef.current, volumeText),
    [volumeText],
  );

  return (
    <div className="flex flex-col gap-6 px-6 pb-6">
      <div className="relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-lg shadow-md">
        <ImageWithFallback
          src={getImageSrc(track.image, "high")}
          alt=""
          fill
          sizes="288px"
          fallback="/images/placeholder/song.jpg"
        />
        <Skeleton className="absolute inset-0 -z-10" />
      </div>

      <div className="min-w-0 text-center">
        <p className="truncate font-heading text-lg text-foreground">
          {track.name}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {track.subtitle}
        </p>
      </div>

      <div className="space-y-2">
        <span id={seekLabelId} className="sr-only">
          Seek
        </span>
        <Slider
          ref={seekRef}
          aria-labelledby={seekLabelId}
          value={[pos]}
          max={duration || 1}
          onValueChange={(value: number | readonly number[]) =>
            props.onSeekChange(
              typeof value === "number" ? value : (value[0] as number),
            )
          }
          onValueCommitted={props.onSeekCommit}
          onPointerDown={props.onSeekStart}
          className={sliderBandClass}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDuration(pos, format)}</span>
          <span>{formatDuration(duration, format)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={isLooping ? "Looping" : "Loop"}
          aria-pressed={isLooping || loopPlaylist}
          onClick={props.onLoop}
          className={cn(
            buttonClass,
            !isLooping && !loopPlaylist && "text-muted-foreground",
          )}
        >
          {isLooping ? (
            <Repeat1 aria-hidden strokeWidth={2} className="size-6" />
          ) : (
            <Repeat aria-hidden strokeWidth={2} className="size-6" />
          )}
        </button>
        <button
          type="button"
          aria-label="Previous"
          onClick={props.onPrevious}
          className={buttonClass}
        >
          <Icons.SkipBack aria-hidden className="size-9" />
        </button>
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={props.onPlayPause}
          className={cn(buttonClass, "size-14")}
        >
          {isLoading ? (
            <Loader2 aria-hidden className="size-11 animate-spin" />
          ) : isPlaying ? (
            <Pause aria-hidden className="size-11" />
          ) : (
            <Icons.Play aria-hidden className="size-11" />
          )}
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={props.onNext}
          className={buttonClass}
        >
          <Icons.SkipForward aria-hidden className="size-9" />
        </button>
        <button
          type="button"
          aria-label={isShuffle ? "Shuffling" : "Shuffle"}
          aria-pressed={isShuffle}
          onClick={props.onToggleShuffle}
          className={cn(buttonClass, !isShuffle && "text-muted-foreground")}
        >
          <Shuffle aria-hidden strokeWidth={2.35} className="size-6" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={isMuted ? "Unmute" : "Mute"}
          onClick={props.onToggleMute}
          className={cn(
            buttonClass,
            (!isReady || isMuted) && "text-muted-foreground",
          )}
        >
          {isMuted || volume === 0 ? (
            <VolumeX aria-hidden />
          ) : (
            <Volume2 aria-hidden />
          )}
        </button>
        <span id={volumeLabelId} className="sr-only">
          Volume
        </span>
        <Slider
          ref={volumeRef}
          aria-labelledby={volumeLabelId}
          value={[isMuted ? 0 : volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value: number | readonly number[]) =>
            props.onVolumeChange(
              typeof value === "number" ? value : (value[0] as number),
            )
          }
          className={cn(sliderBandClass, !isReady && "opacity-50")}
        />
      </div>

      <section aria-labelledby={queueHeadingId} className="space-y-2">
        <h3
          id={queueHeadingId}
          className="font-heading text-lg text-foreground"
        >
          Queue
        </h3>
        <QueueList />
      </section>
    </div>
  );
}
