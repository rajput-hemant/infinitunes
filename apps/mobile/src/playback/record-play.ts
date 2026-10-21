import { getErrorCode } from "@infinitunes/core/error-code";
import type { PlayedItem } from "@infinitunes/core/queue-position";

import { authClient } from "~/lib/auth-client";
import { trpcClient } from "~/lib/trpc";

/**
 * Records a track start in the signed-in listener's history (the web's
 * `recordPlay`). Signed out it sends nothing (the stored cookie is read from
 * secure storage, so it must be awaited), and a failure is only logged:
 * history must never interrupt playback. Never rejects.
 */
export async function recordPlay(item: PlayedItem): Promise<void> {
  try {
    if (!(await authClient.getCookie())) return;
    await trpcClient.history.record.mutate(item);
  } catch (error) {
    if (getErrorCode(error) === "UNAUTHORIZED") return;
    console.warn("history: failed to record play", error);
  }
}
