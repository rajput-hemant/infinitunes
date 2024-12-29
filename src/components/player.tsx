"use client";

import React from "react";
import Link from "next/link";
import {
  Loader2,
  MoreVertical,
  MoveUpRight,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useGlobalAudioPlayer } from "react-use-audio-player";

import type { User } from "next-auth";
import type { MyPlaylist } from "@/lib/db/schema";

import { useEventListener } from "@/hooks/use-event-listner";
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useIsTyping,
  useQueue,
  useStreamQuality,
} from "@/hooks/use-store";
import {
  cn,
  formatDuration,
  getDownloadLink,
  getHref,
  getImageSrc,
} from "@/lib/utils";
import { Icons } from "./icons";
import { ImageWithFallback } from "./image-with-fallback";
import { Queue } from "./queue";
import { TileMoreButton } from "./song-list/more-button";
import { Button, buttonVariants } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "./ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { toast } from "./ui/use-toast";

type PlayerProps = {
  user?: User;
  playlists?: MyPlaylist[];
};

export function Player({ user, playlists }: PlayerProps) {
  // stores
  const [queue] = useQueue();
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

  // third party hooks
  const {
    load,
    playing,
    togglePlayPause,
    getPosition,
    isLoading,
    duration,
    loop,
    looping,
    mute,
    muted,
    volume,
    setVolume,
    seek,
    isReady,
  } = useGlobalAudioPlayer();

  React.useEffect(() => {
    if (queue.length && isPlayerInit) {
      const audioSrc = getDownloadLink(
        queue[currentIndex].download_url,
        streamQuality
      );

      load(audioSrc, {
        html5: true,
        // onload: play,
        autoplay: true,
        initialMute: false,
        onend: onEndHandler,
      });
    }
  }, [queue, streamQuality, currentIndex, isPlayerInit]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function loopHandler() {
    if (!isReady) return;

    if (queue.length === 1) {
      loop(!looping);
      toast({
        description:
          looping ? "Looping disabled" : "Playing current song on repeat",
      });
    } else if (!looping && !loopPlaylist) {
      setLoopPlaylist(true);
      loop(false);
      toast({ description: "Looping playlist" });
    } else if (!looping && loopPlaylist) {
      setLoopPlaylist(false);
      loop(true);
    } else if (looping) {
      loop(false);
    }
  }

  function skipToNext() {
    if (!isPlayerInit) setIsPlayerInit(true);

    let index = currentIndex;

    if (isShuffle) {
      index = Math.floor(Math.random() * queue.length);
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
      index = Math.floor(Math.random() * queue.length);
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

  function onEndHandler() {
    let index = currentIndex;

    if (isShuffle) {
      index = Math.floor(Math.random() * queue.length);
    } else {
      if (currentIndex < queue.length - 1) {
        if (!looping) index = currentIndex + 1;
      } else {
        if (loopPlaylist) {
          index = 0;
        }
      }
    }
    setCurrentIndex(index);
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
        !(isReady || queue.length) && "hidden lg:block"
      )}
    >
      <Slider
        value={[pos]}
        max={duration}
        onValueChange={([values]) => {
          setPos(values);
        }}
        onPointerDown={() => {
          setIsDragging(true);
        }}
        onValueCommit={() => {
          seek(pos);
          setPos(getPosition());
          setIsDragging(false);
        }}
      >
        <SliderTrack className="h-1 cursor-pointer">
          <SliderRange />
        </SliderTrack>

        <SliderThumb className="block size-4 cursor-pointer" />
      </Slider>

      <div
        className={cn(
          "flex items-center px-4 pt-3 lg:px-4",
          queue.length === 0 && "text-muted-foreground"
        )}
      >
        <div className="flex w-full gap-4 lg:w-1/3">
          {queue.length && queue[currentIndex]?.image ?
            <>
              <div className="relative aspect-square h-12 shrink-0 overflow-hidden rounded-md shadow">
                <ImageWithFallback
                  src={getImageSrc(queue[currentIndex].image, "low")}
                  alt={queue[currentIndex].name}
                  fill
                  fallback="/images/placeholder/song.jpg"
                />

                <Skeleton className="absolute inset-0 -z-10" />
              </div>

              <div className="flex flex-col justify-center">
                <Link
                  href={getHref(
                    queue[currentIndex].url,
                    queue[currentIndex].type === "song" ? "song" : "episode"
                  )}
                  className="group line-clamp-1 font-heading text-sm text-primary drop-shadow"
                >
                  {queue[currentIndex].name}
                  <MoveUpRight className="invisible mb-1 ml-1 inline-flex size-3 group-hover:visible" />
                </Link>

                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {queue[currentIndex].subtitle}
                </p>
              </div>
            </>
          : <div className="flex items-center space-x-4">
              <Skeleton className="size-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-44 lg:w-64" />
                <Skeleton className="h-3 w-52 2xl:w-[500px]" />
              </div>
            </div>
          }
        </div>

        <div className="flex justify-end lg:w-1/3 lg:justify-evenly">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label={looping ? "Looping" : "Loop"}
                onClick={loopHandler}
                className={cn(
                  "hidden lg:block",
                  !looping && !loopPlaylist && "text-muted-foreground"
                )}
              >
                {looping ?
                  <Repeat1 strokeWidth={2} className="size-7" />
                : <Repeat strokeWidth={2} className="size-7" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {looping ?
                "Playing current song on repeat"
              : loopPlaylist ?
                "Looping playlist"
              : "Loop"}
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label="Previous"
                onClick={skipToPrev}
                className="hidden lg:block"
              >
                <Icons.SkipBack className="size-10" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Previous</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label={playing ? "Pause" : "Play"}
                onClick={playPauseHandler}
              >
                {isLoading ?
                  <Loader2 className="animate-spin" />
                : playing ?
                  <Pause className="size-10" />
                : <Icons.Play className="size-10" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{playing ? "Pause" : "Play"}</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label="Next"
                onClick={skipToNext}
                className="hidden lg:block"
              >
                <Icons.SkipForward className="size-10" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Next</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                aria-label={isShuffle ? "Shuffling" : "Shuffle"}
                onClick={() => setIsShuffle(!isShuffle)}
                className={cn(
                  "hidden lg:block",
                  !isShuffle && "text-muted-foreground"
                )}
              >
                <Shuffle strokeWidth={2.35} />
              </button>
            </TooltipTrigger>
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
              aria-label={muted ? "Unmute" : "Mute"}
              disabled={!isReady || muted}
              onClick={() => mute(!muted)}
              className="disabled:text-muted-foreground"
            >
              {muted ?
                <VolumeX />
              : volume < 0.33 ?
                <Volume />
              : volume < 0.66 ?
                <Volume1 />
              : <Volume2 strokeWidth={2} />}
            </button>

            <Slider
              aria-label="Volume"
              disabled={!isReady || muted}
              value={[volume * 100]}
              defaultValue={[75]}
              onValueChange={([volume]) => {
                setVolume(volume / 100);
              }}
              className="w-44"
            >
              <SliderTrack className="h-1 cursor-pointer">
                <SliderRange
                  className={cn((!isReady || muted) && "bg-accent")}
                />
              </SliderTrack>

              <SliderThumb
                aria-label="Volume slider"
                className={cn(
                  "size-4 cursor-pointer",
                  (!isReady || muted) && "bg-accent"
                )}
              />
            </Slider>

            <span className="w-8 text-sm font-medium">
              {(volume * 100).toFixed()}%
            </span>
          </div>

          <div className="flex">
            <Queue />

            {queue.length > 0 ?
              <TileMoreButton
                item={queue[currentIndex]}
                showAlbum
                user={user}
                playlists={playlists}
                className={buttonVariants({
                  size: "icon",
                  variant: "ghost",
                })}
              />
            : <Button size="icon" variant="ghost">
                <MoreVertical />
              </Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
