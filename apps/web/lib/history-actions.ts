"use server";

import { getErrorCode } from "./error-code";
import { api } from "./trpc/server";

export type PlayedItem = { id: string; type: "song" | "episode" };

/**
 * Record a track start in the signed-in user's listening history. Silently
 * no-ops for logged-out users and swallows failures: history must never
 * interrupt playback. Authorization still runs inside the `history.record`
 * procedure; this wrapper only decides what to log.
 */
export async function recordPlay(item: PlayedItem): Promise<void> {
  try {
    await api.history.record(item);
  } catch (error) {
    if (getErrorCode(error) === "UNAUTHORIZED") return;
    console.error("history: failed to record play", error);
  }
}
