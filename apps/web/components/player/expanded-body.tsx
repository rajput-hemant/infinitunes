import { loopModeOf } from "@infinitunes/core/playback-order";
import { getImageSrc } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Slider } from "@infinitunes/ui/components/slider";
import {
  Loader2,
  ListOrdered,
  Mic2,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

import type { ExpandedPlayerProps } from "~/components/expanded-player";
import { GlassSurface } from "~/components/glass/glass-surface";
import { Icons } from "~/components/icons";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { LikeButton } from "~/components/like-button";
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
import { ExpandedPane, type PaneTab } from "./expanded-pane";
import { ExpandedSeek } from "./expanded-seek";

const PHONE_TABS = [
  { id: "lyrics", label: "Lyrics", Icon: Mic2 },
  { id: "queue", label: "Up next", Icon: ListOrdered },
] as const satisfies readonly {
  id: PaneTab;
  label: string;
  Icon: LucideIcon;
}[];

type ExpandedBodyProps = Omit<
  ExpandedPlayerProps,
  "open" | "onOpenChange" | "track" | "playlists" | "radio"
> & { track: Queue };

/** The large artwork, title, transport and queue of the expanded player. */
export function ExpandedBody({
  track,
  user,
  favorites,
  position,
  duration,
  showRemainingTime,
  onToggleRemainingTime,
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
  const paneId = React.useId();
  const [tab, setTab] = React.useState<PaneTab>("queue");
  const [showPane, setShowPane] = React.useState(false);
  const artwork = React.useRef<HTMLDivElement>(null);
  const previousArt = React.useRef<DOMRect | null>(null);
  const flight = React.useRef<Animation | null>(null);
  React.useLayoutEffect(() => {
    const before = previousArt.current;
    previousArt.current = null;
    const art = artwork.current;
    if (
      !before ||
      !art?.animate ||
      window.matchMedia("(min-width: 768px)").matches
    )
      return;
    flight.current?.cancel();
    const after = art.getBoundingClientRect();
    if (!after.width || !after.height) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "reduced";
    flight.current = art.animate(
      reduced
        ? [{ opacity: 0.5 }, { opacity: 1 }]
        : [
            {
              transformOrigin: "top left",
              transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})`,
            },
            { transformOrigin: "top left", transform: "none" },
          ],
      { duration: reduced ? 160 : 340, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
  });
  React.useEffect(() => () => flight.current?.cancel(), []);
  const volumeRef = useSliderValueText(
    `${isMuted ? 0 : Math.round(volume * 100)} percent`,
  );
  const loopMode = loopModeOf(isLooping, loopPlaylist);

  // Phones reveal the pane on demand: the active button closes it again.
  function togglePhonePane(next: PaneTab) {
    previousArt.current = artwork.current?.getBoundingClientRect() ?? null;
    setShowPane(!(showPane && tab === next));
    setTab(next);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)] md:items-center md:gap-12 md:px-12 md:pt-16">
      <div
        className={cn(
          "flex min-w-0 flex-col gap-4",
          showPane &&
            "max-md:grid max-md:grid-cols-[4rem_minmax(0,1fr)] max-md:items-center max-md:[&>*:nth-child(n+3)]:col-span-2",
        )}
      >
        <div
          ref={artwork}
          className={cn(
            "relative mx-auto aspect-square w-full max-w-88 overflow-hidden rounded-lg shadow-md transition-[transform,opacity] duration-slow ease-panel md:max-w-120",
            !isPlaying && "md:scale-[0.88]",
            showPane && "max-md:max-w-16",
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

        {/* The title is centred over the artwork; the like button is pinned to
            the end so it does not pull the text off-centre. */}
        <div
          className={cn(
            "relative mt-2 px-12 text-center md:mt-5",
            showPane && "max-md:mt-0 max-md:pr-12 max-md:pl-0 max-md:text-left",
          )}
        >
          <p className="font-heading text-2xl/8 font-bold text-balance break-words text-foreground">
            {track.name}
          </p>
          <p className="truncate text-base/6 text-muted-foreground">
            {track.subtitle}
          </p>
          <LikeButton
            user={user}
            type={track.type}
            token={track.id}
            name={track.name}
            favourites={favorites}
            className="absolute top-1/2 right-0 -translate-y-1/2"
          />
        </div>

        <ExpandedSeek
          position={position}
          duration={duration}
          showRemainingTime={showRemainingTime}
          onToggleRemainingTime={onToggleRemainingTime}
          onSeekStart={onSeekStart}
          onSeekChange={onSeekChange}
          onSeekCommit={onSeekCommit}
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Shuffle"
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
            aria-label="Loop"
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
            title={isMuted ? "Unmute" : "Mute"}
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
        </div>

        <div className="flex items-center justify-between gap-2 md:hidden">
          {PHONE_TABS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="ghost"
              aria-expanded={showPane && tab === id}
              aria-controls={paneId}
              onClick={() => togglePhonePane(id)}
              className={cn(
                controlStyles.text,
                showPane && tab === id
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>
      <ExpandedPane
        id={paneId}
        track={track}
        tab={tab}
        onTabChange={setTab}
        visible={showPane}
        position={position}
        onSeek={(value) => {
          onSeekStart();
          onSeekChange(value);
          onSeekCommit();
        }}
      />
    </div>
  );
}
