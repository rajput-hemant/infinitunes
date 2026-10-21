import type { SongRowItem } from "@infinitunes/types";

import { playerStore } from "~/playback/player-store";

/** Queues the whole list from its first row. */
export function playAll(rows: readonly SongRowItem[]) {
  playerStore.getState().playTracks(rows);
}

/** Queues the whole list in a random order. */
export function shuffleAll(rows: readonly SongRowItem[]) {
  playerStore.getState().playTracks(rows, { shuffle: true });
}

/** Queues the whole list and starts from the pressed row. */
export function playFrom(rows: readonly SongRowItem[], startIndex: number) {
  playerStore.getState().playTracks(rows, { startIndex });
}
