"use server";

import { getErrorCode } from "./error-code";
import { api } from "./trpc/server";

export type PlayedItem = { id: string; type: "song" | "episode" };

/**
 * Record a track start in the signed-in user's listening history. Silently
 * no-ops for logged-out users (`protectedProcedure` is the only session
 * lookup) and swallows failures: history must never interrupt playback.
 */
export async function recordPlay(item: PlayedItem): Promise<void> {
  try {
    await api.history.record(item);
  } catch (error) {
    if (getErrorCode(error) === "UNAUTHORIZED") return;
    console.error("history: failed to record play", error);
  }
}
