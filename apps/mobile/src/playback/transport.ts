import { audioPlayer, hasSourceEnded, markSourceEnded } from "./audio-engine";
import { beginPlaybackRequest } from "./playback-request";
import { playbackPosition } from "./playback-status";
import { playerStore } from "./player-store";

/**
 * Play/pause for every control (mini player, full player, a playing row).
 * The first press of a run starts the restored queue; a track that played to
 * its end restarts.
 */
export function togglePlayback() {
  const { started, start } = playerStore.getState();
  if (!started) {
    start();
    return;
  }
  if (audioPlayer.playing) {
    beginPlaybackRequest();
    audioPlayer.pause();
    return;
  }
  resumePlayback();
}

/** Plays the loaded source on; one that played to its end starts over. */
export function resumePlayback() {
  beginPlaybackRequest();
  if (audioPlayer.playing) return;
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
