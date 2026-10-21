"use server";

import { getErrorCode } from "@infinitunes/core/error-code";
import type { PlayedItem } from "@infinitunes/core/queue-position";

import { api } from "./trpc/server";

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
