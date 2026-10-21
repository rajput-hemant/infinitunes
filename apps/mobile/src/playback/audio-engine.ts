import type { LoadTrack } from "@infinitunes/core/react/use-track-playback";
import type { Queue } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { AudioMetadata } from "expo-audio";

/**
 * The app's one native audio player (AVPlayer, Media3 ExoPlayer), created
 * once and kept for the app's lifetime so playback survives every screen.
 * Only the playback controller and the transport functions touch it.
 *
 * A single `AudioPlayer` rather than expo-audio's `AudioPlaylist`: the
 * playlist reports no load error, so the bitrate step-down could not work,
 * and the queue rules (shuffle, repeat, radio refill) live in the store.
 */
export const audioPlayer = createAudioPlayer(null, { updateInterval: 250 });

/**
 * Background playback, playback in silent mode, and an exclusive session:
 * the OS only ties the lock screen and notification controls to a player
 * that does not mix with other apps.
 */
export function configureAudioSession() {
  return setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
}

/**
 * Whether the loaded source played to its end (the engine's `didJustFinish`).
 * A resume then starts it over: the final position can land a little short of
 * the reported duration, so comparing the two is not enough.
 */
let sourceEnded = false;

export function markSourceEnded(ended: boolean) {
  sourceEnded = ended;
}

export function hasSourceEnded() {
  return (
    sourceEnded ||
    (audioPlayer.duration > 0 &&
      audioPlayer.currentTime >= audioPlayer.duration)
  );
}

/** Replaces the source and starts it (`useTrackPlayback`'s engine hook). */
export const loadTrack: LoadTrack = (src, { loop }) => {
  sourceEnded = false;
  audioPlayer.replace({ uri: src });
  audioPlayer.loop = loop;
  audioPlayer.play();
};

/** 500px artwork: sharp on the lock screen and the notification. */
export function nowPlayingMetadata(track: Queue): AudioMetadata {
  return {
    title: track.name,
    artist: track.subtitle,
    artworkUrl: getImageSrc(track.image, "high"),
  };
}
