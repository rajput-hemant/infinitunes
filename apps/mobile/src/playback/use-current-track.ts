import { isCurrentTrack } from "@infinitunes/core/queue-position";

import { usePlaybackStatus } from "./playback-status";
import { usePlayer } from "./player-store";

type TrackRef = { id: string; queueItemId?: string };

/**
 * Whether a row is the entry the player is on, and whether it is sounding.
 * A queue row (with `queueItemId`) matches only its own entry, so a song
 * queued twice highlights one copy.
 */
export function useCurrentTrackState(track: TrackRef) {
  const isCurrent = usePlayer((state) =>
    isCurrentTrack(state.queue, state.currentIndex, track),
  );
  const playing = usePlaybackStatus((state) => state.playing);
  return { isCurrent, isPlaying: isCurrent && playing };
}
