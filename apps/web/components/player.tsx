"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import {
  formatDuration,
  getDownloadLink,
  getImageSrc,
  seededIndex,
  toQueue,
} from "@infinitunes/types";
import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Slider } from "@infinitunes/ui/components/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import {
  Loader2,
  MoreVertical,
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

import { useEventListener } from "~/hooks/use-event-listner";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useIsTyping,
  useQueue,
  useStreamQuality,
} from "~/hooks/use-store";
import type { User } from "~/lib/auth";
import { api } from "~/lib/trpc/client";
import { cn, getHref } from "~/lib/utils";

import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { Queue } from "./queue";
import { TileMoreButton } from "./song-list/more-button";

const controlClass =
  "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type PlayerProps = {
  user?: User;
  playlists?: MyPlaylist[];
  favorites?: Favorite;
};

export function Player({ user, playlists, favorites }: PlayerProps) {
  return (
    <PlayerInner user={user} playlists={playlists} favorites={favorites} />
  );
}

function PlayerInner({ user, playlists, favorites }: PlayerProps) {
  const seekLabelId = React.useId();
  const volumeLabelId = React.useId();
  // stores
  const [queue, setQueue] = useQueue();
  const [activeRadio] = useActiveRadioSession();
  const [streamQuality] = useStreamQuality();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  const [isTyping] = useIsTyping();
  // refs
  const frameRef = React.useRef<number>(0);
  // states
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [loopPlaylist, setLoopPlaylist] = React.useState(false);
  const [pos, setPos] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const refillingRef = React.useRef<boolean>(false);

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
      const seed = `${latest.queue[latest.currentIndex]?.id ?? latest.currentIndex}:${latest.currentIndex}:end`;
      index = seededIndex(seed, latest.queue.length);
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

  React.useEffect(() => {
    const current = queue[currentIndex];
    if (queue.length && isPlayerInit && current) {
      const audioSrc = getDownloadLink(current.download_url, streamQuality);

      if (!audioSrc) {
        toast.error("This song can't be played right now.");
        return;
      }

      load(audioSrc, {
        html5: true,
        // onload: play,
        autoplay: true,
        initialMute: false,
        onend: onEndHandler,
      });
    }
  }, [queue, streamQuality, currentIndex, isPlayerInit, load, onEndHandler]);

  React.useEffect(() => {
    if (isDragging) {
      return;
    }

    const animate = () => {
      setPos(getPosition());
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [getPosition, isDragging]);

  React.useEffect(() => {
    if (!activeRadio || refillingRef.current || queue.length === 0) return;
    if (currentIndex >= queue.length - 3) {
      refillingRef.current = true;
      utils.radio.songs
        .fetch({
          stationId: activeRadio.stationId,
          k: 10,
          next: 1,
        })
        .then((moreSongs) => {
          if (moreSongs.length > 0) {
            const currentIds = new Set(queue.map((s) => s.id));
            const newItems = moreSongs
              .filter((s) => !currentIds.has(s.id))
              .map(toQueue);
            if (newItems.length > 0) {
              setQueue((prev) => [...prev, ...newItems]);
            }
          }
        })
        .catch(() => {
          // Ignore transient background refill glitches
        })
        .finally(() => {
          refillingRef.current = false;
        });
    }
  }, [currentIndex, queue, activeRadio, utils, setQueue]);

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
      const seed = `${queue[currentIndex]?.id ?? currentIndex}:${currentIndex}:next`;
      index = seededIndex(seed, queue.length);
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
      const seed = `${queue[currentIndex]?.id ?? currentIndex}:${currentIndex}:prev`;
      index = seededIndex(seed, queue.length);
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

  /* -----------------------------------------------------------------------------------------------
   * Keyboard shortcuts (Keybinds)
   * -----------------------------------------------------------------------------------------------*/

  useEventListener("keydown", (e) => {
    if (e.key === " ") {
      if (!isTyping) {
        e.preventDefault();
        playPauseHandler();
      }
    } else if (e.key === "n" || (e.shiftKey && e.key === "ArrowRight")) {
      skipToNext();
    } else if (e.key === "p" || (e.shiftKey && e.key === "ArrowLeft")) {
      skipToPrev();
    } else if (e.shiftKey && e.key === "ArrowUp") {
      setVolume(volume + 0.05);
    } else if (e.shiftKey && e.key === "ArrowDown") {
      setVolume(volume - 0.05);
    } else if (e.key === "l") {
      loopHandler();
    } else if (e.key === "s") {
      setIsShuffle(!isShuffle);
    }
  });

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-14 z-40 h-20 bg-background animate-in slide-in-from-bottom-full [animation-duration:500ms] lg:bottom-0",
        !(isReady || queue.length) && "hidden lg:block",
      )}
    >
      <span id={seekLabelId} className="sr-only">
        Seek
      </span>
      <Slider
        aria-labelledby={seekLabelId}
        value={[pos]}
        max={duration || 1}
        onValueChange={(value: number | readonly number[], _details) => {
          setPos(typeof value === "number" ? value : (value[0] as number));
        }}
        onValueCommitted={() => {
          seek(pos);
          setPos(getPosition());
          setIsDragging(false);
        }}
        onPointerDown={() => {
          setIsDragging(true);
        }}
      />

      <div
        className={cn(
          "flex items-center px-4 pt-3 lg:px-4",
          queue.length === 0 && "text-muted-foreground",
        )}
      >
        <div className="flex w-full min-w-0 gap-4 lg:w-1/3">
          {queue.length && queue[currentIndex]?.image ? (
            <>
              <div className="relative aspect-square h-12 shrink-0 overflow-hidden rounded-md shadow-sm">
                <ImageWithFallback
                  src={getImageSrc(queue[currentIndex].image, "low")}
                  alt={queue[currentIndex].name}
                  fill
                  fallback="/images/placeholder/song.jpg"
                />

                <Skeleton className="absolute inset-0 -z-10" />
              </div>

              <div className="flex min-w-0 flex-col justify-center">
                <Link
                  href={getHref(
                    queue[currentIndex].url,
                    queue[currentIndex].type === "song" ? "song" : "episode",
                  )}
                  className="group line-clamp-1 font-heading text-sm text-primary drop-shadow-sm"
                >
                  {queue[currentIndex].name}
                  <MoveUpRight className="invisible mb-1 ml-1 inline-flex size-3 group-hover:visible" />
                </Link>

                <p className="line-clamp-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {activeRadio && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Radio className="size-2.5 animate-pulse" />
                      {activeRadio.name}
                    </span>
                  )}
                  <span className="truncate">
                    {queue[currentIndex].subtitle}
                  </span>
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

        <div className="flex shrink-0 items-center justify-end gap-3 lg:w-1/3 lg:justify-evenly lg:gap-0">
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <button
                  aria-label={isLooping ? "Looping" : "Loop"}
                  onClick={loopHandler}
                  className={cn(
                    controlClass,
                    "hidden lg:block",
                    !isLooping && !loopPlaylist && "text-muted-foreground",
                  )}
                >
                  {isLooping ? (
                    <Repeat1 strokeWidth={2} className="size-7" />
                  ) : (
                    <Repeat strokeWidth={2} className="size-7" />
                  )}
                </button>
              }
            />
            <TooltipContent>
              {isLooping
                ? "Playing current song on repeat"
                : loopPlaylist
                  ? "Looping playlist"
                  : "Loop"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <button
                  aria-label="Previous"
                  onClick={skipToPrev}
                  className={controlClass}
                >
                  <Icons.SkipBack aria-hidden className="size-8 lg:size-10" />
                </button>
              }
            />
            <TooltipContent>Previous</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={playPauseHandler}
                  className={controlClass}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="size-10" />
                  ) : (
                    <Icons.Play className="size-10" />
                  )}
                </button>
              }
            />
            <TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <button
                  aria-label="Next"
                  onClick={skipToNext}
                  className={controlClass}
                >
                  <Icons.SkipForward
                    aria-hidden
                    className="size-8 lg:size-10"
                  />
                </button>
              }
            />
            <TooltipContent>Next</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <button
                  aria-label={isShuffle ? "Shuffling" : "Shuffle"}
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={cn(
                    controlClass,
                    "hidden lg:block",
                    !isShuffle && "text-muted-foreground",
                  )}
                >
                  <Shuffle strokeWidth={2.35} />
                </button>
              }
            />
            <TooltipContent>
              {isShuffle ? "Shuffling" : "Shuffle"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="hidden w-1/3 items-center justify-end gap-4 lg:flex">
          <p className="shrink-0 text-sm text-muted-foreground">
            {formatDuration(pos, pos > 3600 ? "hh:mm:ss" : "mm:ss")}
            {" / "}
            {formatDuration(duration, duration > 3600 ? "hh:mm:ss" : "mm:ss")}
          </p>

          <div className="hidden items-center gap-4 xl:flex">
            <button
              aria-label={isMuted ? "Unmute" : "Mute"}
              onClick={() => {
                if (!isReady) return;
                if (isMuted) {
                  unmute();
                  if (volume === 0) {
                    setVolume(0.75);
                  }
                } else {
                  mute();
                }
              }}
              className={cn(
                controlClass,
                "transition-opacity hover:opacity-100",
                (!isReady || isMuted) && "text-muted-foreground opacity-50",
              )}
            >
              {isMuted || volume === 0 ? (
                <VolumeX />
              ) : volume < 0.33 ? (
                <Volume />
              ) : volume < 0.66 ? (
                <Volume1 />
              ) : (
                <Volume2 strokeWidth={2} />
              )}
            </button>

            <span id={volumeLabelId} className="sr-only">
              Volume
            </span>
            <Slider
              aria-labelledby={volumeLabelId}
              value={[isMuted ? 0 : volume * 100]}
              defaultValue={[75]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value: number | readonly number[], _details) => {
                const v =
                  typeof value === "number" ? value : (value[0] as number);
                if (!isReady) return;
                const newVolume = v / 100;
                setVolume(newVolume);
                if (newVolume > 0 && isMuted) {
                  unmute();
                }
                if (newVolume === 0 && !isMuted) {
                  mute();
                }
              }}
              className={cn(
                "w-44 transition-opacity hover:opacity-100",
                !isReady && "opacity-50",
              )}
            />

            <span className="w-8 text-sm font-medium">
              {isMuted ? "0" : Math.round(volume * 100)}%
            </span>
          </div>

          <div className="flex">
            <Queue />

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
                })}
              />
            ) : (
              <Button size="icon" variant="ghost" aria-label="More">
                <MoreVertical aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerInner;
