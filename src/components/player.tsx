"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  MoreVertical,
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

import { cn, formatDuration, getDownloadLink, getImageSrc } from "@/lib/utils";
import { useEventListener } from "@/hooks/use-event-listner";
import {
  useCurrentSongIndex,
  useIsPlayerInit,
  useQueue,
  useStreamQuality,
} from "@/hooks/use-store";
import { Icons } from "./icons";
import { TileMoreButton } from "./song/tile-more-button";
import { Skeleton } from "./ui/skeleton";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "./ui/slider";
import { Muted } from "./ui/topography";

const Player = () => {
  // stores
  const [queue] = useQueue();
  const [streamQuality] = useStreamQuality();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();
  const [isPlayerInit, setIsPlayerInit] = useIsPlayerInit();
  // refs
  const frameRef = useRef<number>();
  // states
  const [isShuffle, setIsShuffle] = useState(false);
  const [loopPlaylist, setLoopPlaylist] = useState(false);
  const [pos, setPos] = useState(0);
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

  useEffect(() => {
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

  useEffect(() => {
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
  }, [getPosition]);

  function loopHandler() {
    if (!isReady) return;

    if (queue.length === 1) {
      loop(!looping);
    } else if (!looping && !loopPlaylist) {
      setLoopPlaylist(true);
      loop(false);
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
      e.preventDefault();

      playPauseHandler();
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
        "bg-background animate-in slide-in-from-bottom-full fixed inset-x-0 bottom-14 z-40 h-20 [animation-duration:500ms] lg:bottom-0",
        !(isReady || queue.length) && "hidden lg:block"
      )}
    >
      <Slider
        value={[pos]}
        max={duration}
        onValueChange={([values]) => {
          seek(values);
          setPos(values);
        }}
      >
        <SliderTrack className="h-1 cursor-pointer">
          <SliderRange />
        </SliderTrack>

        <SliderThumb className="hidden h-4 w-4 cursor-pointer lg:block" />
      </Slider>

      <div
        className={cn(
          "flex items-center px-4 pt-3 lg:px-4",
          queue.length === 0 && "text-muted-foreground"
        )}
      >
        <div className="flex w-full gap-4 lg:w-1/3">
          {queue.length && queue[currentIndex]?.image ? (
            <>
              <div className="relative aspect-square h-12 overflow-hidden rounded-md">
                <Image
                  src={getImageSrc(queue[currentIndex].image, "low")}
                  alt={queue[currentIndex].name}
                  fill
                />

                <Skeleton className="absolute inset-0 -z-10" />
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-primary line-clamp-1 text-sm font-semibold">
                  {queue[currentIndex].name}
                </p>

                <Muted className="line-clamp-1">
                  {queue[currentIndex].subtitle}
                </Muted>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-44 lg:w-64" />
                <Skeleton className="h-3 w-52 2xl:w-[500px]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end lg:w-1/3 lg:justify-evenly">
          <button
            onClick={loopHandler}
            className={cn(
              "hidden lg:block",
              !looping && !loopPlaylist && "text-muted-foreground"
            )}
          >
            {looping ? (
              <Repeat1 strokeWidth={2} className="h-7 w-7" />
            ) : (
              <Repeat strokeWidth={2} className="h-7 w-7" />
            )}
          </button>

          <button onClick={skipToPrev} className="hidden lg:block">
            <Icons.SkipBack className="h-10 w-10" />
          </button>

          <button onClick={playPauseHandler}>
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {playing ? (
                  <Pause className="h-10 w-10" />
                ) : (
                  <Icons.Play className="h-10 w-10" />
                )}
              </>
            )}
          </button>

          <button onClick={skipToNext} className="hidden lg:block">
            <Icons.SkipForward className="h-10 w-10" />
          </button>

          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={cn(
              "hidden lg:block",
              !isShuffle && "text-muted-foreground"
            )}
          >
            <Shuffle strokeWidth={2.35} />
          </button>
        </div>

        <div className="hidden w-1/3 items-center justify-end gap-4 lg:flex">
          <Muted>
            {formatDuration(pos, pos > 3600 ? "hh:mm:ss" : "mm:ss")}
            {" / "}
            {formatDuration(duration, duration > 3600 ? "hh:mm:ss" : "mm:ss")}
          </Muted>

          <button
            disabled={!isReady || muted}
            onClick={() => mute(!muted)}
            className="disabled:text-muted-foreground"
          >
            {!!muted ? (
              <VolumeX />
            ) : (
              <>
                {volume < 0.33 ? (
                  <Volume />
                ) : volume < 0.66 ? (
                  <Volume1 />
                ) : (
                  <Volume2 strokeWidth={2} />
                )}
              </>
            )}
          </button>

          <Slider
            disabled={!isReady || muted}
            value={[volume * 100]}
            defaultValue={[75]}
            onValueChange={([volume]) => {
              setVolume(volume / 100);
            }}
            className="w-44"
          >
            <SliderTrack className="h-1 cursor-pointer">
              <SliderRange className={cn((!isReady || muted) && "bg-accent")} />
            </SliderTrack>

            <SliderThumb
              className={cn(
                "h-4 w-4 cursor-pointer",
                (!isReady || muted) && "bg-accent"
              )}
            />
          </Slider>

          <span className="w-8 text-sm font-medium">
            {(volume * 100).toFixed()}%
          </span>

          {queue.length > 0 ? (
            <TileMoreButton item={queue[currentIndex]} showAlbum />
          ) : (
            <MoreVertical />
          )}
        </div>
      </div>
    </div>
  );
};

export default Player;
