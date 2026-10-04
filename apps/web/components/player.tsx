"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import {
  formatDuration,
  getDownloadLink,
  getImageSrc,
  pickShuffleIndex,
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

import { useKeydown } from "~/hooks/use-keydown";
import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useIsTyping,
  useKeyboardShortcuts,
  useQueue,
  useStreamQuality,
} from "~/hooks/use-store";
import type { User } from "~/lib/auth";
import { recordPlay } from "~/lib/history-actions";
import { shouldIgnoreShortcut } from "~/lib/keyboard";
import { playToRecord } from "~/lib/queue-position";
import { api } from "~/lib/trpc/client";
import { cn, getHref } from "~/lib/utils";

import { ExpandedPlayer, setValueText } from "./expanded-player";
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
  const seekRef = React.useRef<HTMLDivElement>(null);
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
  const [pos, setPos] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const refillingRef = React.useRef<boolean>(false);
  const lastRecordedRef = React.useRef<string | null>(null);

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

  // Depend on the resolved source, not on `queue`: `load` destroys and
  // recreates the Howl, so keying on `queue` would restart the playing track
  // whenever anything is queued, removed or radio-refilled.
  const current = queue[currentIndex];
  const hasCurrent = Boolean(current);
  const audioSrc = current
    ? getDownloadLink(current.download_url, streamQuality)
    : "";

  React.useEffect(() => {
    if (!isPlayerInit || !hasCurrent) return;

    if (!audioSrc) {
      toast.error("This song can't be played right now.");
      return;
    }

    // Once per queue entry: a quality change reloads the source but is not a
    // new listen. Read the track through the ref to keep the deps stable.
    const { queue: latestQueue, currentIndex: latestIndex } =
      playbackStateRef.current;
    const track = latestQueue[latestIndex];
    const play = playToRecord(track, lastRecordedRef.current);
    if (track && play) {
      lastRecordedRef.current = track.queueItemId;
      void recordPlay(play);
    }

    load(audioSrc, {
      html5: true,
      // onload: play,
      autoplay: true,
      initialMute: false,
      onend: onEndHandler,
    });
  }, [audioSrc, hasCurrent, isPlayerInit, load, onEndHandler]);

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
        .fetch(
          {
            stationId: activeRadio.stationId,
            k: 10,
            next: 1,
          },
          // The app-wide staleTime is Infinity, which would hand back the first
          // batch forever; every refill must hit upstream for fresh songs.
          { staleTime: 0 },
        )
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
    setPos(value);
  }

  function seekCommit() {
    seek(pos);
    setPos(getPosition());
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
    }
  });

  const seekFormat = duration >= 3600 ? "hh:mm:ss" : "mm:ss";
  const seekText = `${formatDuration(pos, seekFormat)} of ${formatDuration(duration, seekFormat)}`;
  const volumeText = `${isMuted ? 0 : Math.round(volume * 100)} percent`;

  // The Slider wrapper does not forward per-thumb props, so the readable value
  // is set on the thumb's range input directly (see `setValueText`).
  React.useEffect(() => setValueText(seekRef.current, seekText), [seekText]);
  React.useEffect(
    () => setValueText(volumeRef.current, volumeText),
    [volumeText],
  );

  return (
    <section
      aria-label="Player"
      className={cn(
        "fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 h-20 bg-background animate-in slide-in-from-bottom-full [animation-duration:500ms] lg:bottom-0",
        !(isReady || queue.length) && "hidden lg:block",
      )}
    >
      <output aria-live="polite" className="sr-only">
        {current ? `Now playing ${current.name}, ${current.subtitle}` : ""}
      </output>
      <span id={seekLabelId} className="sr-only">
        Seek
      </span>
      <Slider
        ref={seekRef}
        aria-labelledby={seekLabelId}
        value={[pos]}
        max={duration || 1}
        onValueChange={(value: number | readonly number[], _details) =>
          seekChange(typeof value === "number" ? value : (value[0] as number))
        }
        onValueCommitted={seekCommit}
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
        <div className="relative flex w-full min-w-0 gap-4 lg:w-1/3">
          {current && (
            // Below lg the transport row is the only other control, so the
            // whole info area opens the expanded player.
            <button
              type="button"
              aria-label="Open player"
              onClick={() => setIsExpanded(true)}
              className={cn(controlClass, "absolute inset-0 z-10 lg:hidden")}
            />
          )}
          {queue.length && queue[currentIndex]?.image ? (
            <>
              <div className="relative aspect-square h-12 shrink-0 overflow-hidden rounded-md shadow-sm">
                <ImageWithFallback
                  src={getImageSrc(queue[currentIndex].image, "low")}
                  alt={queue[currentIndex].name}
                  fill
                  sizes="48px"
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
                  <MoveUpRight
                    aria-hidden
                    className="invisible mb-1 ml-1 inline-flex size-3 group-hover:visible"
                  />
                </Link>

                <p className="line-clamp-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {activeRadio && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Radio aria-hidden className="size-2.5 animate-pulse" />
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

        <div className="flex shrink-0 items-center justify-end gap-0.5 lg:w-1/3 lg:justify-evenly lg:gap-0">
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
                    <Repeat1 aria-hidden strokeWidth={2} className="size-7" />
                  ) : (
                    <Repeat aria-hidden strokeWidth={2} className="size-7" />
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
                  className={cn(controlClass, "p-1.5 lg:p-0")}
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
                  className={cn(controlClass, "p-1 lg:p-0")}
                >
                  {isLoading ? (
                    <Loader2 aria-hidden className="size-10 animate-spin" />
                  ) : isPlaying ? (
                    <Pause aria-hidden className="size-10" />
                  ) : (
                    <Icons.Play aria-hidden className="size-10" />
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
                  className={cn(controlClass, "p-1.5 lg:p-0")}
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
                  <Shuffle aria-hidden strokeWidth={2.35} />
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
            {formatDuration(pos, pos >= 3600 ? "hh:mm:ss" : "mm:ss")}
            {" / "}
            {formatDuration(duration, seekFormat)}
          </p>

          <div className="hidden items-center gap-4 xl:flex">
            <button
              aria-label={isMuted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className={cn(
                controlClass,
                "transition-opacity hover:opacity-100",
                (!isReady || isMuted) && "text-muted-foreground opacity-50",
              )}
            >
              {isMuted || volume === 0 ? (
                <VolumeX aria-hidden />
              ) : volume < 0.33 ? (
                <Volume aria-hidden />
              ) : volume < 0.66 ? (
                <Volume1 aria-hidden />
              ) : (
                <Volume2 aria-hidden strokeWidth={2} />
              )}
            </button>

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

      <ExpandedPlayer
        open={isExpanded}
        onOpenChange={setIsExpanded}
        track={current}
        pos={pos}
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
    </section>
  );
}

export default PlayerInner;
