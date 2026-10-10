"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import { getImageSrc, pickShuffleIndex } from "@infinitunes/types";
import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Slider } from "@infinitunes/ui/components/slider";
import {
  Loader2,
  MoreVertical,
  ListOrdered,
  Maximize2,
  MoveUpRight,
  Pause,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useAudioPlayerContext } from "react-use-audio-player";
import { toast } from "sonner";

import { GlassSurface } from "~/components/glass/glass-surface";
import { useGlassArtwork } from "~/hooks/use-glass-artwork";
import { useKeydown } from "~/hooks/use-keydown";
import { useRadioRefill } from "~/hooks/use-radio-refill";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useIsTyping,
  useKeyboardShortcuts,
  useQueue,
  useStreamQuality,
} from "~/hooks/use-store";
import { useTrackPlayback } from "~/hooks/use-track-playback";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { recordPlay } from "~/lib/history-actions";
import { shouldIgnoreShortcut } from "~/lib/keyboard";
import { createPositionStore } from "~/lib/position-store";
import { api } from "~/lib/trpc/client";
import { cn, getHref } from "~/lib/utils";

import { ExpandedPlayer } from "./expanded-player";
import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { BarButton } from "./player/bar-button";
import { ActiveDot, scrubClass, setValueText } from "./player/controls";
import { MiniProgress, SeekBar } from "./player/seek-bar";
import { trackArtworkUrl } from "./player/track-artwork";
import { Queue, useQueuePane } from "./queue";
import { TileMoreButton } from "./song-list/more-button";

// Distance a drag on the mini player must travel upward to open the expanded view.
const SWIPE_UP_PX = 40;

type PlayerProps = {
  user?: User;
  playlists?: MyPlaylist[];
  favorites?: Favorite | null;
};

export function Player({ user, playlists, favorites }: PlayerProps) {
  const volumeRef = React.useRef<HTMLDivElement>(null);
  const volumeLabelId = React.useId();
  // stores
  const [queue, setQueue] = useQueue();
  const [activeRadio] = useActiveRadioSession();
  const [streamQuality] = useStreamQuality();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isTyping] = useIsTyping();
  const [shortcutsEnabled] = useKeyboardShortcuts();
  // refs
  const frameRef = React.useRef<number>(0);
  // states
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [loopPlaylist, setLoopPlaylist] = React.useState(false);
  const [position] = React.useState(createPositionStore);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const pane = useQueuePane();
  const touchStartY = React.useRef<number | null>(null);

  const utils = api.useUtils();

  // third party hooks
  const {
    load,
    isPlaying,
    togglePlayPause,
    getPosition,
    isLoading,
    duration,
    isLooping,
    mute,
    unmute,
    isMuted,
    volume,
    setVolume,
    seek,
    isReady,
    player,
  } = useAudioPlayerContext();

  // Howler captures `onend` when the song is loaded, so the handler has to stay
  // referentially stable - a changing identity would reload and restart the
  // current song every time shuffle/loop is toggled. Read the latest playback
  // state through a ref instead of closing over it.
  const playbackStateRef = React.useRef({
    queue,
    currentIndex,
    isShuffle,
    isLooping,
    loopPlaylist,
  });

  React.useEffect(() => {
    playbackStateRef.current = {
      queue,
      currentIndex,
      isShuffle,
      isLooping,
      loopPlaylist,
    };
  });

  const onEndHandler = React.useCallback(() => {
    const latest = playbackStateRef.current;

    let index = latest.currentIndex;

    if (latest.isShuffle) {
      if (!latest.isLooping) {
        index = pickShuffleIndex(latest.queue.length, latest.currentIndex);
      }
    } else {
      if (latest.currentIndex < latest.queue.length - 1) {
        if (!latest.isLooping) index = latest.currentIndex + 1;
      } else {
        if (latest.loopPlaylist) {
          index = 0;
        }
      }
    }

    setCurrentIndex(index);
  }, [setCurrentIndex]);

  useTrackPlayback({
    queue,
    currentIndex,
    streamQuality,
    isPlayerInit,
    load,
    onEnd: onEndHandler,
    record: recordPlay,
  });

  const current = queue[currentIndex];
  useGlassArtwork(trackArtworkUrl(current));

  React.useEffect(() => {
    if (isDragging) {
      return;
    }

    const animate = () => {
      position.set(getPosition());
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getPosition, isDragging, position]);

  const fetchRadioSongs = React.useCallback(
    (stationId: string) =>
      utils.radio.songs.fetch(
        { stationId, k: 10, next: 1 },
        // The app-wide staleTime is Infinity, which would hand back the first
        // batch forever; every refill must hit upstream for fresh songs.
        { staleTime: 0 },
      ),
    [utils],
  );

  useRadioRefill({
    activeRadio,
    queue,
    currentIndex,
    fetchSongs: fetchRadioSongs,
    setQueue,
  });

  function loopHandler() {
    if (!isReady) return;

    if (queue.length === 1) {
      if (isLooping) {
        player?.loopOff();
        toast("Looping disabled");
      } else {
        player?.loopOn();
        toast("Playing current song on repeat");
      }
    } else if (!isLooping && !loopPlaylist) {
      setLoopPlaylist(true);
      player?.loopOn();
      toast("Looping playlist");
    } else if (!isLooping && loopPlaylist) {
      setLoopPlaylist(false);
      player?.loopOff();
    } else if (isLooping) {
      player?.loopOff();
    }
  }

  function skipToNext() {
    if (!isPlayerInit) setIsPlayerInit(true);

    let index = currentIndex;

    if (isShuffle) {
      index = pickShuffleIndex(queue.length, currentIndex);
    } else {
      if (currentIndex < queue.length - 1) {
        index = currentIndex + 1;
      } else {
        if (loopPlaylist) {
          index = 0;
        }
      }
    }
    setCurrentIndex(index);
  }

  function skipToPrev() {
    if (!isPlayerInit) setIsPlayerInit(true);

    let index;

    if (isShuffle) {
      index = pickShuffleIndex(queue.length, currentIndex);
    } else {
      if (currentIndex > 0) {
        index = currentIndex - 1;
      } else {
        if (loopPlaylist) {
          index = queue.length - 1;
        } else {
          index = currentIndex;
        }
      }
    }

    setCurrentIndex(index);
  }

  function playPauseHandler() {
    if (isPlayerInit) {
      togglePlayPause();
    } else {
      setIsPlayerInit(true);
    }
  }

  function seekChange(value: number) {
    position.set(value);
  }

  function seekCommit() {
    seek(position.get());
    position.set(getPosition());
    setIsDragging(false);
  }

  function volumeChange(percent: number) {
    if (!isReady) return;
    const newVolume = percent / 100;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      unmute();
    }
    if (newVolume === 0 && !isMuted) {
      mute();
    }
  }

  function toggleMute() {
    if (!isReady) return;
    if (isMuted) {
      unmute();
      if (volume === 0) {
        setVolume(0.75);
      }
    } else {
      mute();
    }
  }

  /* -----------------------------------------------------------------------------------------------
   * Keyboard shortcuts (Keybinds)
   * -----------------------------------------------------------------------------------------------*/

  useKeydown((e) => {
    if (isTyping || shouldIgnoreShortcut(e, { enabled: shortcutsEnabled }))
      return;

    if (e.key === " ") {
      e.preventDefault();
      playPauseHandler();
    } else if (e.key === "n" || (e.shiftKey && e.key === "ArrowRight")) {
      skipToNext();
    } else if (e.key === "p" || (e.shiftKey && e.key === "ArrowLeft")) {
      skipToPrev();
    } else if (e.shiftKey && e.key === "ArrowUp") {
      setVolume(Math.min(1, volume + 0.05));
    } else if (e.shiftKey && e.key === "ArrowDown") {
      setVolume(Math.max(0, volume - 0.05));
    } else if (e.key === "l") {
      loopHandler();
    } else if (e.key === "s") {
      setIsShuffle(!isShuffle);
    } else if (e.key === "q") {
      e.preventDefault();
      pane.setOpen(!pane.open);
    }
  });

  const volumeText = `${isMuted ? 0 : Math.round(volume * 100)} percent`;

  // The Slider wrapper does not forward per-thumb props, so the readable value
  // is set on the thumb's range input directly (see `setValueText`).
  React.useEffect(
    () => setValueText(volumeRef.current, volumeText),
    [volumeText],
  );

  return (
    <>
      <GlassSurface
        render={<section aria-label="Player" />}
        size="m"
        glassRole="player"
        className={cn(
          // `--pl-r` is the concentric radius the artwork derives from: the
          // bar is r-lg + 4px, the phone pill is fully round.
          "@container fixed right-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 z-40 h-14 [--pl-r:999px] rounded-(--pl-r) transition-[left,right] duration-base ease-spring md:bottom-3 md:left-21 md:h-18 md:[--pl-r:calc(var(--radius-lg)+0.25rem)] lg:left-[calc(var(--side-w)+0.75rem)]",
          "min-[1440px]:in-data-[queue=open]:right-[calc(var(--queue-w)+0.75rem)]",
          !(isReady || queue.length) && "hidden md:block",
        )}
      >
        <output aria-live="polite" className="sr-only">
          {current ? `Now playing ${current.name}, ${current.subtitle}` : ""}
        </output>
        <div
          className={cn(
            "grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 md:grid-cols-[minmax(9rem,1fr)_minmax(15rem,36rem)_minmax(9rem,1fr)] md:gap-4 md:px-3",
            queue.length === 0 && "text-muted-foreground",
          )}
        >
          <div
            className="relative flex min-w-0 items-center gap-3"
            onTouchStart={(event) => {
              touchStartY.current = event.touches[0]?.clientY ?? null;
            }}
            onTouchEnd={(event) => {
              if (
                touchStartY.current !== null &&
                touchStartY.current - (event.changedTouches[0]?.clientY ?? 0) >
                  SWIPE_UP_PX
              ) {
                setIsExpanded(true);
              }
              touchStartY.current = null;
            }}
          >
            {current && (
              // Below md the transport row is the only other control, so the
              // whole info area opens the expanded player.
              <button
                type="button"
                aria-label="Open player"
                onClick={() => setIsExpanded(true)}
                className="absolute inset-0 z-10 rounded-full md:hidden"
              />
            )}
            {current?.image ? (
              <>
                <div className="relative size-10 shrink-0 overflow-hidden rounded-[max(0.25rem,calc(var(--pl-r)-0.625rem))] max-md:rounded-full md:size-12">
                  <ImageWithFallback
                    src={getImageSrc(current.image, "low")}
                    alt={current.name}
                    fill
                    sizes="48px"
                    fallback="/images/placeholder/song.jpg"
                  />

                  <Skeleton className="absolute inset-0 -z-10" />
                </div>

                <div className="flex min-w-0 flex-col justify-center">
                  <Link
                    href={getHref(
                      current.url,
                      current.type === "song" ? "song" : "episode",
                    )}
                    className="group line-clamp-1 text-sm/5 font-semibold text-foreground hover:text-primary"
                  >
                    {current.name}
                    <MoveUpRight
                      aria-hidden
                      className="invisible mb-1 ml-1 inline-flex size-3 group-hover:visible"
                    />
                  </Link>

                  <p className="line-clamp-1 flex items-center gap-1.5 text-xs/4 text-muted-foreground">
                    {activeRadio && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-medium text-primary">
                        <Radio aria-hidden className="size-2.5 animate-pulse" />
                        {activeRadio.name}
                      </span>
                    )}
                    <span className="truncate">{current.subtitle}</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Skeleton className="size-12 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-44 lg:w-64" />
                  <Skeleton className="h-3 w-52 2xl:w-[500px]" />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 md:min-w-0">
            <div className="flex items-center justify-center gap-1 md:gap-2">
              <BarButton
                tooltip={isShuffle ? "Shuffling" : "Shuffle"}
                aria-label={isShuffle ? "Shuffling" : "Shuffle"}
                aria-pressed={isShuffle}
                onClick={() => setIsShuffle(!isShuffle)}
                className={cn(
                  controlStyles.transport,
                  "hidden md:inline-flex",
                  !isShuffle && "text-muted-foreground",
                )}
              >
                <Shuffle aria-hidden strokeWidth={2} className="size-5" />
                <ActiveDot on={isShuffle} />
              </BarButton>

              <BarButton
                tooltip="Previous"
                aria-label="Previous"
                onClick={skipToPrev}
                className={cn(controlStyles.transport, "hidden md:inline-flex")}
              >
                <Icons.SkipBack aria-hidden className="size-5" />
              </BarButton>

              <BarButton
                tooltip={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={playPauseHandler}
                className={cn(
                  controlStyles.transportPlayMini,
                  "bg-foreground text-background hover:opacity-85",
                )}
              >
                {isLoading ? (
                  <Loader2 aria-hidden className="size-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause aria-hidden className="size-5" />
                ) : (
                  <Icons.Play aria-hidden className="size-5" />
                )}
              </BarButton>

              <BarButton
                tooltip="Next"
                aria-label="Next"
                onClick={skipToNext}
                className={controlStyles.transport}
              >
                <Icons.SkipForward aria-hidden className="size-5" />
              </BarButton>

              <BarButton
                tooltip={
                  isLooping
                    ? "Playing current song on repeat"
                    : loopPlaylist
                      ? "Looping playlist"
                      : "Loop"
                }
                aria-label={isLooping ? "Looping" : "Loop"}
                aria-pressed={isLooping || loopPlaylist}
                onClick={loopHandler}
                className={cn(
                  controlStyles.transport,
                  "hidden md:inline-flex",
                  !isLooping && !loopPlaylist && "text-muted-foreground",
                )}
              >
                {isLooping ? (
                  <Repeat1 aria-hidden strokeWidth={2} className="size-5" />
                ) : (
                  <Repeat aria-hidden strokeWidth={2} className="size-5" />
                )}
                <ActiveDot on={isLooping || loopPlaylist} />
              </BarButton>
            </div>
            <div className="hidden w-full min-w-0 md:block">
              <SeekBar
                position={position}
                duration={duration}
                onChange={seekChange}
                onCommit={seekCommit}
                onStart={() => setIsDragging(true)}
              />
            </div>
          </div>

          <div className="hidden min-w-0 items-center justify-end gap-1 md:flex">
            <div className="hidden items-center gap-1 @min-[860px]:flex">
              <BarButton
                tooltip={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute" : "Mute"}
                aria-pressed={isMuted}
                onClick={toggleMute}
                className={cn(
                  controlStyles.transport,
                  (!isReady || isMuted) && "text-muted-foreground",
                )}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX aria-hidden className="size-5" />
                ) : volume < 0.33 ? (
                  <Volume aria-hidden className="size-5" />
                ) : volume < 0.66 ? (
                  <Volume1 aria-hidden className="size-5" />
                ) : (
                  <Volume2 aria-hidden className="size-5" />
                )}
              </BarButton>

              <span id={volumeLabelId} className="sr-only">
                Volume
              </span>
              <Slider
                ref={volumeRef}
                aria-labelledby={volumeLabelId}
                value={[isMuted ? 0 : volume * 100]}
                defaultValue={[75]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value: number | readonly number[], _details) =>
                  volumeChange(
                    typeof value === "number" ? value : (value[0] as number),
                  )
                }
                className={cn(
                  scrubClass,
                  "w-24 min-w-16",
                  !isReady && "opacity-50",
                )}
              />
            </div>

            <BarButton
              tooltip="Queue"
              aria-label="Queue"
              aria-expanded={pane.open}
              aria-controls="player-queue"
              onClick={() => pane.setOpen(!pane.open)}
              className={cn(
                controlStyles.headerIcon,
                pane.open && "text-primary",
              )}
            >
              <ListOrdered aria-hidden className="size-5" />
            </BarButton>

            <BarButton
              tooltip="Expand player"
              aria-label="Expand player"
              onClick={() => setIsExpanded(true)}
              className={controlStyles.headerIcon}
            >
              <Maximize2 aria-hidden className="size-5" />
            </BarButton>

            {queue.length > 0 ? (
              <TileMoreButton
                item={queue[currentIndex]}
                showAlbum
                user={user}
                playlists={playlists}
                favorites={favorites}
                className={buttonVariants({
                  size: "icon",
                  variant: "ghost",
                  className: controlStyles.headerIcon,
                })}
              />
            ) : (
              <Button
                size="icon"
                variant="ghost"
                aria-label="More"
                className={controlStyles.headerIcon}
              >
                <MoreVertical aria-hidden="true" className="size-5" />
              </Button>
            )}
          </div>
        </div>

        <MiniProgress position={position} duration={duration} />
      </GlassSurface>

      <Queue open={pane.open} onOpenChange={pane.setOpen} />

      <ExpandedPlayer
        open={isExpanded}
        onOpenChange={setIsExpanded}
        track={current}
        position={position}
        duration={duration}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isLooping={isLooping}
        loopPlaylist={loopPlaylist}
        isShuffle={isShuffle}
        isMuted={isMuted}
        isReady={isReady}
        volume={volume}
        onSeekStart={() => setIsDragging(true)}
        onSeekChange={seekChange}
        onSeekCommit={seekCommit}
        onVolumeChange={volumeChange}
        onToggleMute={toggleMute}
        onLoop={loopHandler}
        onPrevious={skipToPrev}
        onPlayPause={playPauseHandler}
        onNext={skipToNext}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
      />
    </>
  );
}
