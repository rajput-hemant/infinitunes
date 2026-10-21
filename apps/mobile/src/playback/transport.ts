import { audioPlayer } from "./audio-engine";
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
    audioPlayer.pause();
    return;
  }
  resumePlayback();
}

/** Plays the loaded source on; one that played to its end starts over. */
export function resumePlayback() {
  if (audioPlayer.playing) return;
  if (
    audioPlayer.duration > 0 &&
    audioPlayer.currentTime >= audioPlayer.duration
  ) {
    void audioPlayer.seekTo(0);
  }
  audioPlayer.play();
}

export function seekTo(seconds: number) {
  playbackPosition.set(seconds);
  void audioPlayer.seekTo(seconds);
}
