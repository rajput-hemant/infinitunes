import type { SongRowItem } from "@infinitunes/types";

import { showFailure } from "~/lib/failure";
import { playerStore } from "~/playback/player-store";

const NOTHING_TO_PLAY = "Nothing to play yet";

/** Queues the whole list from its first row. */
export function playAll(rows: readonly SongRowItem[]) {
  if (rows.length === 0) return showFailure(NOTHING_TO_PLAY);
  playerStore.getState().playTracks(rows);
}

/** Queues the whole list in a random order. */
export function shuffleAll(rows: readonly SongRowItem[]) {
  if (rows.length === 0) return showFailure(NOTHING_TO_PLAY);
  playerStore.getState().playTracks(rows, { shuffle: true });
}

/** Queues the whole list and starts from the pressed row. */
export function playFrom(rows: readonly SongRowItem[], startIndex: number) {
  playerStore.getState().playTracks(rows, { startIndex });
}
