import { usePlayhead } from "@infinitunes/core/react/use-playhead";
import { useRadioRefill } from "@infinitunes/core/react/use-radio-refill";
import {
  PLAYBACK_PROBLEM_MESSAGES,
  useTrackPlayback,
  type LoadTrack,
  type PlaybackProblem,
} from "@infinitunes/core/react/use-track-playback";
import { useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner-native";

import { usePreferences } from "~/lib/preferences";
import { trpcClient } from "~/lib/trpc";

import {
  audioPlayer,
  configureAudioSession,
  loadTrack,
  markSourceEnded,
  nowPlayingMetadata,
} from "./audio-engine";
import { requestMediaNotificationPermission } from "./media-notification";
import { playbackPosition, playbackStatusStore } from "./playback-status";
import { playerStore, selectCurrentTrack, usePlayer } from "./player-store";
import { recordPlay } from "./record-play";
import { resumePlayback } from "./transport";

const getPosition = () => audioPlayer.currentTime;

/** What the engine reported for the source loaded last. */
type SourceState = { error?: string; loaded: boolean };
const FRESH_SOURCE: SourceState = { loaded: false };

function showProblem(problem: PlaybackProblem) {
  toast.error(PLAYBACK_PROBLEM_MESSAGES[problem]);
}

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
  const { advanceAfterEnd, skipUnplayable, updateQueue } =
    playerStore.getState();
  const streamQuality = usePreferences((state) => state.streamQuality);
  const status = useAudioPlayerStatus(audioPlayer);
  // The current source's outcome, kept per load. The status hook cannot
  // carry it: the engine reports `error` on one event only (the next status
  // says `null`, often in the same JS task, so React may never render it),
  // and nothing guarantees a rendered status between `replace` and the next
  // failure, so `isLoaded` and an identical error message could carry over
  // from the previous source. `useTrackPlayback` steps down
  // a bitrate on each new `loadError` (the web's player resets it per load).
  const [source, setSource] = useState<SourceState>(FRESH_SOURCE);
  const load = useCallback<LoadTrack>((src, options) => {
    setSource(FRESH_SOURCE);
    loadTrack(src, options);
  }, []);

  useEffect(() => {
    void configureAudioSession();
  }, []);

  useEffect(() => {
    if (started) requestMediaNotificationPermission();
  }, [started]);

  useTrackPlayback({
    queue,
    currentIndex,
    streamQuality,
    isPlayerInit: started,
    load,
    record: recordPlay,
    onProblem: showProblem,
    loadError: source.error,
    isLooping: repeatOne,
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

  usePlayhead({
    store: playbackPosition,
    getPosition,
    playing: status.playing,
  });

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
        if (update.didJustFinish) {
          // Repeat-one loops in the engine, which plays on from the start.
          if (!audioPlayer.loop) markSourceEnded(true);
          advanceAfterEnd();
        }
        const { error, isLoaded } = update;
        if (error) {
          // The first error of a load counts; it is the one that failed it.
          setSource((prev) => (prev.error ? prev : { ...prev, error }));
        } else if (isLoaded) {
          setSource((prev) => (prev.loaded ? prev : { ...prev, loaded: true }));
        }
      },
    );
    return () => subscription.remove();
  }, [advanceAfterEnd]);

  // The queue was emptied under the playing entry: nothing is left to show
  // or control it, so stop the engine and take it off the lock screen.
  const hasTrack = track !== undefined;
  useEffect(() => {
    if (!started || hasTrack) return;
    audioPlayer.pause();
    audioPlayer.clearLockScreenControls();
  }, [started, hasTrack]);

  useEffect(() => {
    playbackStatusStore.setState({
      playing: status.playing,
      buffering: status.isBuffering,
      duration: status.duration,
    });
  }, [status.playing, status.isBuffering, status.duration]);

  useEffect(() => {
    if (!started || !track) return;
    audioPlayer.setActiveForLockScreen(true, nowPlayingMetadata(track));
  }, [started, track]);

  return null;
}
