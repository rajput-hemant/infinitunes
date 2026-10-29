import { useEffect, useRef } from "react";
import type { useAudioPlayerContext } from "react-use-audio-player";

import { mediaMetadataInit, positionStateOf } from "~/lib/media-session";

type Howl = ReturnType<typeof useAudioPlayerContext>["player"];

type MediaSessionTrack = Parameters<typeof mediaMetadataInit>[0];

type MediaSessionActions = {
  play: () => void;
  pause: () => void;
  previous: () => void;
  next: () => void;
  seekTo: (seconds: number) => void;
  stop: () => void;
};

type Options = {
  /** The current queue entry; `undefined` clears the session. */
  track: MediaSessionTrack | undefined;
  howl: Howl;
  isPlaying: boolean;
  duration: number;
  getPosition: () => number;
  /** The same functions the player's buttons call. */
  actions: MediaSessionActions;
};

function sessionOf(): MediaSession | undefined {
  return typeof navigator !== "undefined" && "mediaSession" in navigator
    ? navigator.mediaSession
    : undefined;
}

/**
 * Hands the OS the player's metadata and transport. With handlers registered,
 * media keys, headsets and the browser's own controls call the same functions
 * as the on-screen buttons (queue, shuffle, repeat and radio rules included)
 * instead of the browser pausing the element behind the app's back.
 * `seekbackward`/`seekforward` stay unset: some lock screens swap them in for
 * Previous/Next.
 */
export function useMediaSession({
  track,
  howl,
  isPlaying,
  duration,
  getPosition,
  actions,
}: Options) {
  const latest = useRef({ actions, getPosition });
  useEffect(() => {
    latest.current = { actions, getPosition };
  });

  useEffect(() => {
    const session = sessionOf();
    if (!session) return;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => latest.current.actions.play()],
      ["pause", () => latest.current.actions.pause()],
      ["previoustrack", () => latest.current.actions.previous()],
      ["nexttrack", () => latest.current.actions.next()],
      ["stop", () => latest.current.actions.stop()],
      [
        "seekto",
        ({ seekTime }) => {
          if (typeof seekTime === "number")
            latest.current.actions.seekTo(seekTime);
        },
      ],
    ];
    // Browsers throw for actions they do not support; the rest still apply.
    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        /* unsupported action */
      }
    };
    for (const [action, handler] of handlers) setHandler(action, handler);
    return () => {
      for (const [action] of handlers) setHandler(action, null);
      session.metadata = null;
      session.playbackState = "none";
    };
  }, []);

  // Keyed on what the OS shows, not on the entry's identity (a refilled queue
  // hands back new objects for the same track).
  const metadata = track ? JSON.stringify(mediaMetadataInit(track)) : undefined;
  useEffect(() => {
    const session = sessionOf();
    if (!session) return;
    session.metadata =
      metadata && typeof MediaMetadata !== "undefined"
        ? new MediaMetadata(JSON.parse(metadata) as MediaMetadataInit)
        : null;
  }, [metadata]);

  const hasTrack = track !== undefined;
  useEffect(() => {
    const session = sessionOf();
    if (!session) return;
    session.playbackState = !hasTrack
      ? "none"
      : isPlaying
        ? "playing"
        : "paused";
  }, [hasTrack, isPlaying]);

  // The OS extrapolates the position while playing, so it is only told about
  // jumps: a new track (a new Howl), play/pause, a seek, a duration that just
  // became known. Howler emits `play`/`pause`/`seek` for every one of them,
  // including the pauses the element sync mirrors in.
  useEffect(() => {
    const session = sessionOf();
    if (!session) return;
    const sync = () => {
      const state = positionStateOf(duration, latest.current.getPosition());
      if (!state) return;
      try {
        session.setPositionState(state);
      } catch {
        /* a rejected state only leaves the OS scrubber stale */
      }
    };
    sync();
    const events = ["play", "pause", "seek"] as const;
    for (const event of events) howl?.on(event, sync);
    return () => {
      for (const event of events) howl?.off(event, sync);
    };
  }, [howl, duration]);
}
