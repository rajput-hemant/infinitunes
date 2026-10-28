import { useEffect } from "react";
import type { useAudioPlayerContext } from "react-use-audio-player";

type Howl = ReturnType<typeof useAudioPlayerContext>["player"];

/**
 * The `<audio>` element behind an html5 Howl. Howler keeps it on its sound
 * (the library reaches in the same way); a Howl without one (web audio, a
 * test double) simply has nothing to follow.
 */
function audioNodeOf(howl: object): HTMLMediaElement | undefined {
  const sounds: unknown = Reflect.get(howl, "_sounds");
  const first: unknown = Array.isArray(sounds) ? sounds[0] : undefined;
  const node: unknown =
    typeof first === "object" && first !== null
      ? Reflect.get(first, "_node")
      : undefined;
  return typeof HTMLMediaElement !== "undefined" &&
    node instanceof HTMLMediaElement
    ? node
    : undefined;
}

/**
 * Keeps Howler's idea of "playing" in step with the real element. Howler only
 * knows what its own `play()`/`pause()` did, so when anything else pauses or
 * resumes the element (a media key without a Media Session handler, a headset,
 * another tab's audio focus, a phone call) the library's `isPlaying` goes
 * stale: the button shows Pause over silence, and `play()` is a no-op because
 * Howler still thinks it is playing. Mirroring the element's `pause`/`play`
 * into the Howl makes it emit its own events, so every consumer of
 * `isPlaying` follows.
 */
export function useAudioElementSync(howl: Howl) {
  useEffect(() => {
    const node = howl ? audioNodeOf(howl) : undefined;
    if (!howl || !node) return;

    // Pooled elements are reused by the next Howl and an unloaded one pauses
    // its element late, so a `pause` only counts once this Howl has really
    // been heard playing (`playing` follows actual output, unlike `play`).
    let heardPlaying = !node.paused && howl.playing();
    const onPlaying = () => {
      heardPlaying = true;
    };
    const onPause = () => {
      // The end of a track fires `pause` first and Howler handles `ended`;
      // Howler's own pause() leaves `howl.playing()` false already.
      if (!heardPlaying || node.ended || !node.paused) return;
      heardPlaying = false;
      if (howl.state() === "loaded" && howl.playing()) howl.pause();
    };
    const onPlay = () => {
      if (node.paused || howl.state() !== "loaded" || howl.playing()) return;
      howl.play();
    };

    node.addEventListener("playing", onPlaying);
    node.addEventListener("pause", onPause);
    node.addEventListener("play", onPlay);
    return () => {
      node.removeEventListener("playing", onPlaying);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("play", onPlay);
    };
  }, [howl]);
}
