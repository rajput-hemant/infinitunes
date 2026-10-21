import { pickShuffleIndex } from "@infinitunes/types";

type PlaybackOrder = {
  length: number;
  currentIndex: number;
  shuffle: boolean;
  loopPlaylist: boolean;
};

/**
 * `ended` is the engine's end-of-track callback, where repeat-one keeps the
 * same track. `skip` is a Next press, which always moves on.
 */
type AdvanceTrigger =
  | { reason: "ended"; repeatOne: boolean }
  | { reason: "skip" };

export function nextTrackIndex(
  order: PlaybackOrder,
  trigger: AdvanceTrigger,
): number {
  const { length, currentIndex, shuffle, loopPlaylist } = order;
  const repeatOne = trigger.reason === "ended" && trigger.repeatOne;

  if (shuffle) {
    return repeatOne ? currentIndex : pickShuffleIndex(length, currentIndex);
  }
  if (currentIndex < length - 1) {
    return repeatOne ? currentIndex : currentIndex + 1;
  }
  return loopPlaylist ? 0 : currentIndex;
}

export function prevTrackIndex(order: PlaybackOrder): number {
  const { length, currentIndex, shuffle, loopPlaylist } = order;

  if (shuffle) return pickShuffleIndex(length, currentIndex);
  if (currentIndex > 0) return currentIndex - 1;
  return loopPlaylist ? length - 1 : currentIndex;
}

/** The label state the repeat control shows: off, the whole playlist, or one track. */
export type LoopMode = "off" | "playlist" | "track";

export function loopModeOf(
  isLooping: boolean,
  loopPlaylist: boolean,
): LoopMode {
  if (isLooping) return "track";
  return loopPlaylist ? "playlist" : "off";
}

/**
 * The repeat control's next state. A single entry toggles repeat-one; a longer
 * queue cycles off, then the whole queue, then the current track.
 */
export function nextLoopMode(mode: LoopMode, queueLength: number): LoopMode {
  if (queueLength <= 1) return mode === "track" ? "off" : "track";
  if (mode === "off") return "playlist";
  return mode === "playlist" ? "track" : "off";
}

/** What each app announces when the repeat control lands on a mode. */
export const LOOP_MODE_MESSAGES: Record<LoopMode, string> = {
  off: "Looping disabled",
  playlist: "Looping playlist",
  track: "Playing current song on repeat",
};

/** Every item once, in random order. `random` is injectable for tests. */
export function shuffled<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  return items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}
