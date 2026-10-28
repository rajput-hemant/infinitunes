import { createPositionStore } from "@infinitunes/core/react/position-store";

/**
 * The player's playhead and seek, shared with the page body (the song page's
 * synced lyrics follow it). There is one player per document, so a module
 * singleton is enough; `Player` is the only writer.
 */
export const playhead = createPositionStore();

export const playerSeek: { current: ((seconds: number) => void) | undefined } =
  { current: undefined };
