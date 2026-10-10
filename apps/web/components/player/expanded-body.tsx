import { getImageSrc } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Slider } from "@infinitunes/ui/components/slider";
import {
  Loader2,
  ListOrdered,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as React from "react";

import type { ExpandedPlayerProps } from "~/components/expanded-player";
import { GlassSurface } from "~/components/glass/glass-surface";
import { Icons } from "~/components/icons";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import {
  ActiveDot,
  scrubClass,
  sliderValueOf,
  useSliderValueText,
  washButtonClass,
  washGlassButtonClass,
} from "./controls";
import { ExpandedSeek } from "./expanded-seek";
import { QueueList } from "./queue-list";
import { loopModeOf } from "./track-index";

type ExpandedBodyProps = Omit<
  ExpandedPlayerProps,
  "open" | "onOpenChange" | "track"
> & { track: Queue };

/** The large artwork, title, transport and queue of the expanded player. */
export function ExpandedBody({
  track,
  position,
  duration,
  isPlaying,
  isLoading,
  isLooping,
  loopPlaylist,
  isShuffle,
  isMuted,
  isReady,
  volume,
  onSeekStart,
  onSeekChange,
  onSeekCommit,
  onVolumeChange,
  onToggleMute,
  onLoop,
  onPrevious,
  onPlayPause,
  onNext,
  onToggleShuffle,
}: ExpandedBodyProps) {
  const volumeLabelId = React.useId();
  const queueHeadingId = React.useId();
  const queueRegionId = React.useId();
  const [showQueue, setShowQueue] = React.useState(false);
  const volumeRef = useSliderValueText(
    `${isMuted ? 0 : Math.round(volume * 100)} percent`,
  );
  const loopMode = loopModeOf(isLooping, loopPlaylist);

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
          position={position}
          duration={duration}
          onSeekStart={onSeekStart}
          onSeekChange={onSeekChange}
          onSeekCommit={onSeekCommit}
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={isShuffle ? "Shuffling" : "Shuffle"}
            aria-pressed={isShuffle}
            onClick={onToggleShuffle}
            className={cn(
              washButtonClass,
              !isShuffle && "text-muted-foreground",
            )}
          >
            <Shuffle aria-hidden strokeWidth={2} className="size-5" />
            <ActiveDot on={isShuffle} />
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={onPrevious}
            className={washButtonClass}
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
            onClick={onPlayPause}
            className={cn(washGlassButtonClass, controlStyles.transportPlay)}
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
            onClick={onNext}
            className={washButtonClass}
          >
            <Icons.SkipForward aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label={loopMode === "track" ? "Looping" : "Loop"}
            aria-pressed={loopMode !== "off"}
            onClick={onLoop}
            className={cn(
              washButtonClass,
              loopMode === "off" && "text-muted-foreground",
            )}
          >
            {loopMode === "track" ? (
              <Repeat1 aria-hidden strokeWidth={2} className="size-5" />
            ) : (
              <Repeat aria-hidden strokeWidth={2} className="size-5" />
            )}
            <ActiveDot on={loopMode !== "off"} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isMuted ? "Unmute" : "Mute"}
            aria-pressed={isMuted}
            onClick={onToggleMute}
            className={cn(
              washButtonClass,
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
              onVolumeChange(sliderValueOf(value))
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
              washButtonClass,
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
