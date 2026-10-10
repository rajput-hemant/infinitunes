"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import * as React from "react";
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
import { recordPlay } from "~/lib/history-actions";
import { shouldIgnoreShortcut } from "~/lib/keyboard";
import { createPositionStore } from "~/lib/position-store";
import { api } from "~/lib/trpc/client";
import { cn } from "~/lib/utils";

import { ExpandedPlayer } from "./expanded-player";
import { PlayerActions } from "./player/player-actions";
import { PlayerTrackInfo } from "./player/player-track-info";
import { PlayerTransport } from "./player/player-transport";
import { PlayerVolume } from "./player/player-volume";
import { MiniProgress, SeekBar } from "./player/seek-bar";
import { trackArtworkUrl } from "./player/track-artwork";
import {
  loopModeOf,
  nextTrackIndex,
  prevTrackIndex,
} from "./player/track-index";
import { useQueuePane } from "./player/use-queue-pane";
import { Queue } from "./queue";

type PlayerProps = {
  user?: User;
  playlists?: MyPlaylist[];
  favorites?: Favorite | null;
};

export function Player({ user, playlists, favorites }: PlayerProps) {
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
    setCurrentIndex(
      nextTrackIndex(
        {
          length: latest.queue.length,
          currentIndex: latest.currentIndex,
          shuffle: latest.isShuffle,
          loopPlaylist: latest.loopPlaylist,
        },
        { reason: "ended", repeatOne: latest.isLooping },
      ),
    );
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

    setCurrentIndex(
      nextTrackIndex(
        {
          length: queue.length,
          currentIndex,
          shuffle: isShuffle,
          loopPlaylist,
        },
        { reason: "skip" },
      ),
    );
  }

  function skipToPrev() {
    if (!isPlayerInit) setIsPlayerInit(true);

    setCurrentIndex(
      prevTrackIndex({
        length: queue.length,
        currentIndex,
        shuffle: isShuffle,
        loopPlaylist,
      }),
    );
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
          <PlayerTrackInfo
            track={current}
            radio={activeRadio}
            onExpand={() => setIsExpanded(true)}
          />

          <div className="flex shrink-0 flex-col items-center justify-center gap-0.5 md:min-w-0">
            <PlayerTransport
              isShuffle={isShuffle}
              loopMode={loopModeOf(isLooping, loopPlaylist)}
              isPlaying={isPlaying}
              isLoading={isLoading}
              onToggleShuffle={() => setIsShuffle(!isShuffle)}
              onPrevious={skipToPrev}
              onPlayPause={playPauseHandler}
              onNext={skipToNext}
              onToggleLoop={loopHandler}
            />
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
            <PlayerVolume
              isMuted={isMuted}
              isReady={isReady}
              volume={volume}
              onToggleMute={toggleMute}
              onVolumeChange={volumeChange}
            />
            <PlayerActions
              track={current}
              queueOpen={pane.open}
              onToggleQueue={() => pane.setOpen(!pane.open)}
              onExpand={() => setIsExpanded(true)}
              user={user}
              playlists={playlists}
              favorites={favorites}
            />
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
