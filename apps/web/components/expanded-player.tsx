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
  ChevronDown,
  ListOrdered,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react";
import React from "react";

import { GlassSurface } from "~/components/glass/glass-surface";
import { controlStyles } from "~/lib/control-styles";
import { usePosition } from "~/lib/position-store";
import type { PositionStore } from "~/lib/position-store";
import { cn } from "~/lib/utils";

import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { ActiveDot, scrubClass, setValueText } from "./player/controls";
import { QueueList } from "./player/queue-list";

// Plain controls on the artwork wash. The wash is not glass, so these keep the
// flat hover fill and press shrink; the two glass controls below do not.
const buttonClass = cn(
  controlStyles.transport,
  "flex shrink-0 items-center justify-center transition-[background-color,scale] duration-fast ease-spring hover:bg-fill active:scale-[0.96] active:bg-fill-2",
);

// Glass controls get their press from the glass runtime (gel), not a class.
const glassControlClass = cn(
  controlStyles.transport,
  "flex shrink-0 items-center justify-center",
);

// Distance a drag on the header must travel downward to dismiss the sheet.
const SWIPE_DOWN_PX = 80;

type ExpandedPlayerProps = {
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

export function ExpandedPlayer(props: ExpandedPlayerProps) {
  const { open, onOpenChange, track } = props;
  const touchStartY = React.useRef<number | null>(null);

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
          onTouchStart={(event) => {
            touchStartY.current = event.touches[0]?.clientY ?? null;
          }}
          onTouchEnd={(event) => {
            if (
              touchStartY.current !== null &&
              (event.changedTouches[0]?.clientY ?? 0) - touchStartY.current >
                SWIPE_DOWN_PX
            ) {
              onOpenChange(false);
            }
            touchStartY.current = null;
          }}
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
                  glassControlClass,
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
        {track && <ExpandedBody {...props} track={track} />}
      </SheetContent>
    </Sheet>
  );
}

/** The artwork, blurred and saturated, lighting the layer behind the content. */
function ArtworkWash({ image }: { image: Queue["image"] }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <ImageWithFallback
        src={getImageSrc(image, "high")}
        alt=""
        fill
        sizes="100vw"
        fallback="/images/placeholder/song.jpg"
        className="scale-125 rounded-none object-cover opacity-70 blur-2xl saturate-[1.6]"
      />
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
}

/** Owns the per-frame position subscription so `ExpandedBody` stays still. */
function ExpandedSeek({
  position,
  duration,
  onSeekStart,
  onSeekChange,
  onSeekCommit,
}: Pick<
  ExpandedPlayerProps,
  "position" | "duration" | "onSeekStart" | "onSeekChange" | "onSeekCommit"
>) {
  const pos = usePosition(position);
  const seekLabelId = React.useId();
  const seekRef = React.useRef<HTMLDivElement>(null);
  const format = duration >= 3600 ? "hh:mm:ss" : "mm:ss";
  const seekText = `${formatDuration(pos, format)} of ${formatDuration(duration, format)}`;

  React.useEffect(() => setValueText(seekRef.current, seekText), [seekText]);

  return (
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
          onSeekChange(typeof value === "number" ? value : (value[0] as number))
        }
        onValueCommitted={onSeekCommit}
        onPointerDown={onSeekStart}
        className={cn(scrubClass, "[&>*]:py-3")}
      />
      <div className="flex justify-between text-xs/4 tabular-nums text-muted-foreground">
        <span>{formatDuration(pos, format)}</span>
        <span>{formatDuration(duration, format)}</span>
      </div>
    </div>
  );
}

function ExpandedBody(props: ExpandedPlayerProps & { track: Queue }) {
  const {
    track,
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

  const volumeLabelId = React.useId();
  const queueHeadingId = React.useId();
  const queueRegionId = React.useId();
  const [showQueue, setShowQueue] = React.useState(false);
  const volumeRef = React.useRef<HTMLDivElement>(null);

  const volumeText = `${isMuted ? 0 : Math.round(volume * 100)} percent`;

  React.useEffect(
    () => setValueText(volumeRef.current, volumeText),
    [volumeText],
  );

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)] md:items-center md:gap-12 md:px-12 md:pt-16">
      <div className="flex min-w-0 flex-col gap-4">
        <div
          className={cn(
            "relative mx-auto aspect-square w-full max-w-88 overflow-hidden rounded-lg shadow-md transition-transform duration-slow ease-spring md:max-w-120",
            !isPlaying && "md:scale-[0.88]",
          )}
        >
          <ImageWithFallback
            src={getImageSrc(track.image, "high")}
            alt=""
            fill
            sizes="(min-width: 768px) 480px, 352px"
            fallback="/images/placeholder/song.jpg"
          />
          <Skeleton className="absolute inset-0 -z-10" />
        </div>

        <div className="mt-2 min-w-0 text-left md:mt-5">
          <p className="font-heading text-2xl/8 font-bold text-balance break-words text-foreground">
            {track.name}
          </p>
          <p className="truncate text-base/6 text-muted-foreground">
            {track.subtitle}
          </p>
        </div>

        <ExpandedSeek
          position={props.position}
          duration={duration}
          onSeekStart={props.onSeekStart}
          onSeekChange={props.onSeekChange}
          onSeekCommit={props.onSeekCommit}
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={isShuffle ? "Shuffling" : "Shuffle"}
            aria-pressed={isShuffle}
            onClick={props.onToggleShuffle}
            className={cn(buttonClass, !isShuffle && "text-muted-foreground")}
          >
            <Shuffle aria-hidden strokeWidth={2} className="size-5" />
            <ActiveDot on={isShuffle} />
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={props.onPrevious}
            className={buttonClass}
          >
            <Icons.SkipBack aria-hidden className="size-5" />
          </button>
          <GlassSurface
            render={
              <button type="button" aria-label={isPlaying ? "Pause" : "Play"} />
            }
            variant="tinted"
            size="s"
            interactive
            onClick={props.onPlayPause}
            className={cn(glassControlClass, controlStyles.transportPlay)}
          >
            {isLoading ? (
              <Loader2 aria-hidden className="size-6 animate-spin" />
            ) : isPlaying ? (
              <Pause aria-hidden className="size-6" />
            ) : (
              <Icons.Play aria-hidden className="size-6" />
            )}
          </GlassSurface>
          <button
            type="button"
            aria-label="Next"
            onClick={props.onNext}
            className={buttonClass}
          >
            <Icons.SkipForward aria-hidden className="size-5" />
          </button>
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
              <Repeat1 aria-hidden strokeWidth={2} className="size-5" />
            ) : (
              <Repeat aria-hidden strokeWidth={2} className="size-5" />
            )}
            <ActiveDot on={isLooping || loopPlaylist} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isMuted ? "Unmute" : "Mute"}
            aria-pressed={isMuted}
            onClick={props.onToggleMute}
            className={cn(
              buttonClass,
              (!isReady || isMuted) && "text-muted-foreground",
            )}
          >
            {isMuted || volume === 0 ? (
              <VolumeX aria-hidden className="size-5" />
            ) : (
              <Volume2 aria-hidden className="size-5" />
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
            className={cn(scrubClass, "[&>*]:py-3", !isReady && "opacity-50")}
          />
          <button
            type="button"
            aria-label="Up next"
            aria-expanded={showQueue}
            aria-controls={queueRegionId}
            onClick={() => setShowQueue(!showQueue)}
            className={cn(
              buttonClass,
              "md:hidden",
              showQueue ? "text-primary" : "text-muted-foreground",
            )}
          >
            <ListOrdered aria-hidden className="size-5" />
          </button>
        </div>
      </div>
      <section
        id={queueRegionId}
        aria-labelledby={queueHeadingId}
        className={cn(
          "max-h-[50dvh] min-h-0 overflow-y-auto rounded-md p-2 md:block md:h-[min(36rem,70dvh)] md:max-h-none",
          !showQueue && "hidden",
        )}
      >
        <h3
          id={queueHeadingId}
          className="px-2 pt-2 pb-1 text-[0.6875rem]/4 font-semibold tracking-[0.06em] text-muted-foreground uppercase"
        >
          Up next
        </h3>
        <QueueList upNextOnly />
      </section>
    </div>
  );
}
