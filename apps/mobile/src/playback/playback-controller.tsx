import { usePlayhead } from "@infinitunes/core/react/use-playhead";
import { useRadioRefill } from "@infinitunes/core/react/use-radio-refill";
import {
  PLAYBACK_PROBLEM_MESSAGES,
  useTrackPlayback,
  type PlaybackProblem,
} from "@infinitunes/core/react/use-track-playback";
import { useAudioPlayerStatus } from "expo-audio";
import { useEffect } from "react";
import { toast } from "sonner-native";

import { usePreferences } from "~/lib/preferences";
import { trpcClient } from "~/lib/trpc";

import {
  audioPlayer,
  configureAudioSession,
  loadTrack,
  nowPlayingMetadata,
} from "./audio-engine";
import { requestMediaNotificationPermission } from "./media-notification";
import { playbackPosition, playbackStatusStore } from "./playback-status";
import { playerStore, selectCurrentTrack, usePlayer } from "./player-store";
import { recordPlay } from "./record-play";

const getPosition = () => audioPlayer.currentTime;

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
  const { advanceAfterEnd, skipUnplayable, updateQueue } =
    playerStore.getState();
  const streamQuality = usePreferences((state) => state.streamQuality);
  const status = useAudioPlayerStatus(audioPlayer);

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
    load: loadTrack,
    record: recordPlay,
    onProblem: showProblem,
    loadError: status.error ?? undefined,
    isLooping: repeatOne,
    isReady: status.isLoaded,
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

  // A listener, not the status hook: two ends of the same track in a row
  // (repeat) must each advance, and React would merge the equal states.
  useEffect(() => {
    const subscription = audioPlayer.addListener(
      "playbackStatusUpdate",
      (update) => {
        if (update.didJustFinish) advanceAfterEnd();
      },
    );
    return () => subscription.remove();
  }, [advanceAfterEnd]);

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
