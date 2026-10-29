import { Platform } from "react-native";

import {
  audioPlayer,
  hasLiveSource,
  hasSourceEnded,
  markSourceEnded,
} from "./audio-engine";
import { beginPlaybackRequest } from "./playback-request";
import {
  playbackPosition,
  playbackStatusStore,
  requestPlaying,
} from "./playback-status";
import { playerStore } from "./player-store";

/**
 * Play/pause for every control (mini player, full player, a playing row).
 * The first press of a run starts the restored queue; a track that played to
 * its end restarts.
 */
export function togglePlayback() {
  const { started, start, queue } = playerStore.getState();
  const playing =
    Platform.OS === "ios"
      ? (playbackStatusStore.getState().playingIntent ??
        audioPlayer.currentStatus.playing)
      : audioPlayer.currentStatus.playing;
  if (Platform.OS === "ios" && queue.length > 0)
    requestPlaying(!started || !playing);
  try {
    if (!started) {
      start();
      return;
    }
    // The status, not `playing`: Android's reports false while the engine buffers
    // a track the UI shows as playing, and that press must still pause.
    if (playing) {
      beginPlaybackRequest();
      audioPlayer.pause();
      return;
    }
    resumePlayback();
  } catch (error) {
    if (Platform.OS === "ios") requestPlaying(null);
    throw error;
  }
}

/** Plays the loaded source on; one that played to its end starts over. */
export function resumePlayback() {
  beginPlaybackRequest();
  if (
    audioPlayer.playing &&
    !(
      Platform.OS === "ios" &&
      playbackStatusStore.getState().playingIntent !== null
    )
  )
    return;
  const { started, queue } = playerStore.getState();
  if (Platform.OS === "ios" && queue.length > 0) requestPlaying(true);
  if (started && queue.length > 0 && !hasLiveSource()) {
    // Nothing loaded (a problem cleared it): ask the controller to load the entry again.
    playerStore.setState((state) => ({ retryRequest: state.retryRequest + 1 }));
    return;
  }
  if (hasSourceEnded()) {
    markSourceEnded(false);
    void audioPlayer.seekTo(0);
  }
  audioPlayer.play();
}

export function seekTo(seconds: number) {
  beginPlaybackRequest();
  if (seconds < audioPlayer.duration) markSourceEnded(false);
  playbackPosition.set(seconds);
  void audioPlayer.seekTo(seconds);
}
