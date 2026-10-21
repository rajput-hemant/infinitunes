import { getErrorCode } from "@infinitunes/core/error-code";
import type { PlayedItem } from "@infinitunes/core/queue-position";

import { authClient } from "~/lib/auth-client";
import { trpcClient } from "~/lib/trpc";

/**
 * Records a track start in the signed-in listener's history (the web's
 * `recordPlay`). Signed out it sends nothing, and a failure is only logged:
 * history must never interrupt playback.
 */
export function recordPlay(item: PlayedItem) {
  if (!authClient.getCookie()) return;
  trpcClient.history.record.mutate(item).catch((error: unknown) => {
    if (getErrorCode(error) === "UNAUTHORIZED") return;
    console.warn("history: failed to record play", error);
  });
}
