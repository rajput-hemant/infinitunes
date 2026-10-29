import { usePlayhead } from "@infinitunes/core/react/use-playhead";
import { useRadioRefill } from "@infinitunes/core/react/use-radio-refill";
import {
  useTrackPlayback,
  PLAYBACK_PROBLEM_MESSAGES,
  type LoadTrack,
} from "@infinitunes/core/react/use-track-playback";
import type { Queue } from "@infinitunes/types";
import type { AudioStatus } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

import { showFailure } from "~/lib/failure";
import { usePreferences } from "~/lib/preferences";
import { queryClient } from "~/lib/query-client";
import {
  cachedSongSource,
  cacheQualifiedListen,
  createCacheListenTracker,
  evictCachedSong,
} from "~/lib/song-cache";
import { trpcClient } from "~/lib/trpc";
import { lyricsQueryOptions } from "~/lib/use-lyrics";

import {
  audioPlayer,
  configureAudioSession,
  isCurrentSource,
  loadTrack,
  markSourceDead,
  markSourceEnded,
  nowPlayingMetadata,
  replaceSource,
} from "./audio-engine";
import { capturePlaybackRequest } from "./playback-request";
import {
  playbackPosition,
  playbackStatusStore,
  requestPlaying,
  usePlaybackStatus,
} from "./playback-status";
import { playerStore, selectCurrentTrack, usePlayer } from "./player-store";
import { recordPlay } from "./record-play";
import { resumePlayback } from "./transport";

// Tracks are never live streams. Without `isLiveStream: false` iOS infers it
// from the item's duration, which is still indefinite while the first track
// loads, and the lock screen shows "Live" instead of the length.
const activateLockScreen = (track: Queue) =>
  audioPlayer.setActiveForLockScreen(true, nowPlayingMetadata(track), {
    isLiveStream: false,
    showNextTrack: true,
    showPreviousTrack: true,
  });

const getPosition = () => audioPlayer.currentTime;

/** The store changes only when a field the UI reads does (position ticks are not one). */
function publishStatus(update: AudioStatus) {
  const next = {
    playing: update.playing,
    playingIntent:
      update.error ||
      update.didJustFinish ||
      playbackStatusStore.getState().playingIntent === update.playing
        ? null
        : playbackStatusStore.getState().playingIntent,
    buffering: update.isBuffering,
    duration: update.duration,
    bufferedTime: update.bufferedTime ?? 0,
  };
  const previous = playbackStatusStore.getState();
  if (
    previous.playingIntent !== next.playingIntent ||
    previous.playing !== next.playing ||
    previous.buffering !== next.buffering ||
    previous.duration !== next.duration ||
    previous.bufferedTime !== next.bufferedTime
  ) {
    playbackStatusStore.setState(next);
  }
}

/** How soon a playing UI notices an engine that stopped without saying so. */
const STATUS_RECHECK_MS = 500;

/** What the engine reported for the source loaded last. */
type SourceState = { error?: string; loaded: boolean };
const FRESH_SOURCE: SourceState = { loaded: false };

// Uncached on purpose: every refill must hit upstream for fresh songs.
const fetchRadioSongs = (stationId: string) =>
  trpcClient.radio.songs.query({ stationId, k: 10, next: 1 });

/**
 * Connects the player store to the audio engine; mounted once at the root.
 * The queue rules are the web's (`@infinitunes/core`): bitrate step-down and
 * history in `useTrackPlayback`, the playhead in `usePlayhead`, station
 * refills in `useRadioRefill`. This adds the native glue: the audio session,
 * end-of-track, repeat-one, and the lock screen / notification metadata.
 */
export function PlaybackController() {
  const queue = usePlayer((state) => state.queue);
  const currentIndex = usePlayer((state) => state.currentIndex);
  const started = usePlayer((state) => state.started);
  const repeatOne = usePlayer((state) => state.repeat === "track");
  const radio = usePlayer((state) => state.radio);
  const track = usePlayer(selectCurrentTrack);
  const resumeRequest = usePlayer((state) => state.resumeRequest);
  const retryRequest = usePlayer((state) => state.retryRequest);
  const {
    advanceAfterEnd,
    skipToNext,
    skipToPrevious,
    skipUnplayable,
    updateQueue,
  } = playerStore.getState();
  const streamQuality = usePreferences((state) => state.streamQuality);
  // The store, not a copy: whoever changed the engine (a headset, the lock
  // screen, a keyboard's media key) shows once the status reaches it.
  const playing = usePlaybackStatus((state) => state.playing);
  const lockScreenActive = useRef(false);
  // The current source's outcome, kept per load. The status hook cannot
  // carry it: the engine reports `error` on one event only (the next status
  // says `null`, often in the same JS task, so React may never render it),
  // and nothing guarantees a rendered status between `replace` and the next
  // failure, so `isLoaded` and an identical error message could carry over
  // from the previous source. `useTrackPlayback` steps down
  // a bitrate on each new `loadError` (the web's player resets it per load).
  const [source, setSource] = useState<SourceState>(FRESH_SOURCE);
  const loadedEntry = useRef<string | undefined>(undefined);
  const cachedLoad = useRef<{
    id: string;
    source: string;
    options: Parameters<LoadTrack>[1];
  } | null>(null);
  const countListen = useRef(createCacheListenTracker());
  const awaitingRefill = useRef<{
    entryId: string;
    isCurrent: () => boolean;
  } | null>(null);
  // Whether a status belongs to the loaded entry: the queue can move before
  // React runs the source-replacement effect.
  const acceptsStatus = useCallback((update: AudioStatus) => {
    if (!isCurrentSource(update)) return false;
    const current = selectCurrentTrack(playerStore.getState());
    return !current || current.queueItemId === loadedEntry.current;
  }, []);
  const load = useCallback<LoadTrack>((src, options) => {
    awaitingRefill.current = null;
    const current = selectCurrentTrack(playerStore.getState());
    // A transport press belongs to its entry, not the next song.
    if (
      loadedEntry.current !== undefined &&
      loadedEntry.current !== current?.queueItemId
    )
      requestPlaying(null);
    loadedEntry.current = current?.queueItemId;
    const local = current ? cachedSongSource(current, src) : undefined;
    cachedLoad.current =
      local && current ? { id: current.id, source: src, options } : null;
    setSource(FRESH_SOURCE);
    loadTrack(local ?? src, options);
    // A problem took the lock screen down: a retry puts it back with the load.
    if (
      !lockScreenActive.current &&
      current &&
      playerStore.getState().started
    ) {
      activateLockScreen(current);
      lockScreenActive.current = true;
    }
  }, []);

  useEffect(() => {
    void configureAudioSession();
    // Swiping the app away on Android destroys the UI but keeps the process
    // (and this store) alive, so playback would go on and the next launch
    // would reload the "started" track and play it. Closing the app stops it,
    // as a cold start would (iOS ends the process instead).
    return () => {
      audioPlayer.pause();
      audioPlayer.clearLockScreenControls();
      replaceSource(null);
      playerStore.setState({ started: false });
    };
  }, []);

  useTrackPlayback({
    queue,
    currentIndex,
    streamQuality,
    isPlayerInit: started,
    load,
    record: recordPlay,
    onProblem: (problem) => {
      cachedLoad.current = null;
      audioPlayer.pause();
      markSourceDead();
      if (problem !== "unplayable") {
        replaceSource(null);
        // Nothing is loaded for the lock screen's or headset's Play to start.
        audioPlayer.clearLockScreenControls();
        lockScreenActive.current = false;
        // `replace(null)` emits no status: show the stopped engine now.
        playbackStatusStore.setState({
          playing: false,
          playingIntent: null,
          buffering: false,
          duration: 0,
          bufferedTime: 0,
        });
      }
      setSource(FRESH_SOURCE);
      showFailure(PLAYBACK_PROBLEM_MESSAGES[problem]);
    },
    loadError: source.error,
    isLooping: repeatOne,
    retry: retryRequest,
    isReady: source.loaded,
    onUnplayable: skipUnplayable,
  });

  useRadioRefill({
    activeRadio: radio,
    queue,
    currentIndex,
    fetchSongs: fetchRadioSongs,
    setQueue: updateQueue,
  });

  useEffect(() => {
    const pending = awaitingRefill.current;
    if (!pending) return;
    if (
      !pending.isCurrent() ||
      !started ||
      track?.queueItemId !== pending.entryId ||
      !radio
    ) {
      awaitingRefill.current = null;
      return;
    }
    if (queue[currentIndex + 1]) {
      awaitingRefill.current = null;
      advanceAfterEnd();
    }
  }, [queue, currentIndex, started, track, radio, advanceAfterEnd]);

  usePlayhead({
    store: playbackPosition,
    getPosition,
    playing,
  });

  // The playing song's lyrics and the next song's are cached before the
  // listener opens the lyrics (`prefetchQuery` swallows failures).
  const lyricsIds = [queue[currentIndex], queue[currentIndex + 1]]
    .flatMap((entry) => (entry?.type === "song" ? [entry.id] : []))
    .join(",");
  useEffect(() => {
    for (const id of lyricsIds.split(",")) {
      if (id) void queryClient.prefetchQuery(lyricsQueryOptions(id));
    }
  }, [lyricsIds]);

  useEffect(() => {
    audioPlayer.loop = repeatOne;
  }, [repeatOne]);

  // A play that landed on the loaded entry loads nothing new (see the store).
  useEffect(() => {
    if (resumeRequest > 0) resumePlayback();
  }, [resumeRequest]);

  // A listener, not the status hook: two ends of the same track in a row
  // (repeat) must each advance, and React would merge the equal states; a
  // load error is a single event (see `source` above).
  useEffect(() => {
    const subscription = audioPlayer.addListener(
      "playbackStatusUpdate",
      (update) => {
        if (!acceptsStatus(update)) return;
        const current = selectCurrentTrack(playerStore.getState());
        publishStatus(update);
        if (
          current &&
          countListen.current(
            current,
            update.currentTime,
            update.duration,
            update.playing && update.isLoaded && !update.isBuffering,
            update.didJustFinish,
          )
        ) {
          void cacheQualifiedListen(current, streamQuality);
        }
        if (update.didJustFinish) {
          // Repeat-one loops in the engine, which plays on from the start.
          if (!audioPlayer.loop) markSourceEnded(true);
          advanceAfterEnd();
          const state = playerStore.getState();
          if (
            current &&
            state.radio &&
            state.repeat === "off" &&
            selectCurrentTrack(state)?.queueItemId === current.queueItemId &&
            !state.queue[state.currentIndex + 1]
          ) {
            awaitingRefill.current = {
              entryId: current.queueItemId,
              isCurrent: capturePlaybackRequest(),
            };
          }
        }
        const { error, isLoaded } = update;
        if (error) {
          const cached = cachedLoad.current;
          if (cached) {
            cachedLoad.current = null;
            evictCachedSong(cached.id);
            setSource(FRESH_SOURCE);
            // Retry the same bitrate remotely before charging a failure to the shared ladder.
            loadTrack(cached.source, {
              ...cached.options,
              loop: audioPlayer.loop,
            });
            return;
          }
          // The first error of a load counts; it is the one that failed it.
          setSource((prev) => (prev.error ? prev : { ...prev, error }));
        } else if (isLoaded) {
          setSource((prev) => (prev.loaded ? prev : { ...prev, loaded: true }));
        }
      },
    );
    return () => subscription.remove();
  }, [acceptsStatus, advanceAfterEnd, streamQuality]);

  // Keep polling as a fallback for Android and older native builds when a
  // system pause event is missed or arrives before the engine settles.
  // Patched iOS builds also report timeControlStatus changes directly.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const status = audioPlayer.currentStatus;
      if (!status.playing && !status.isBuffering && acceptsStatus(status)) {
        publishStatus(status);
      }
    }, STATUS_RECHECK_MS);
    return () => clearInterval(id);
  }, [playing, acceptsStatus]);

  // Lock screen, notification, headset and Bluetooth next/previous: the engine
  // holds one source (patches/expo-audio), so it only reports the press.
  useEffect(() => {
    const subscription = audioPlayer.addListener("remoteCommand", (event) => {
      if (event.command === "nextTrack") skipToNext();
      else skipToPrevious();
    });
    return () => subscription.remove();
  }, [skipToNext, skipToPrevious]);

  // The queue was emptied under the playing entry (or sign-out reset the
  // session): nothing is left to show or control it, so stop the engine and
  // take it off the lock screen. `started` is false after a sign-out, so the
  // lock screen being active is what says there is something to clear.
  const hasTrack = track !== undefined;
  useEffect(() => {
    if (hasTrack || (!started && !lockScreenActive.current)) return;
    audioPlayer.pause();
    audioPlayer.clearLockScreenControls();
    lockScreenActive.current = false;
  }, [started, hasTrack]);

  // Activated once, by the first load (`load`), then only the metadata
  // changes: on Android every activation rebuilds the MediaSession and takes
  // the foreground-service notification down for a moment, which the OS may
  // use to end background playback between two tracks. An entry that never
  // loads (no source) leaves it cleared.
  useEffect(() => {
    if (!started || !track || !lockScreenActive.current) return;
    audioPlayer.updateLockScreenMetadata(nowPlayingMetadata(track));
  }, [started, track]);

  return null;
}
