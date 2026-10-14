import { removeFromQueue } from "@infinitunes/types";
import * as React from "react";
import { toast } from "sonner";

import { useCurrentSongIndex, useQueue } from "~/hooks/use-store";

/** Exit transition length; the row is removed from state once it finishes. */
const REMOVE_MS = 200;

/**
 * Removes queue rows with the exit transition. A removal is held for
 * `REMOVE_MS` so the row can animate out, then committed to the store.
 */
export function useQueueRemoval() {
  const [queue, setQueue] = useQueue();
  const [currentIndex, setCurrentIndex] = useCurrentSongIndex();

  const listRef = React.useRef<HTMLOListElement>(null);
  const [leaving, setLeaving] = React.useState<ReadonlySet<string>>(new Set());

  // Removals commit after the exit transition, so read the freshest state
  // through a ref: two rapid removals must not act on a stale queue.
  const latest = React.useRef({ queue, currentIndex });
  React.useEffect(() => {
    latest.current = { queue, currentIndex };
  });

  // Pending exit timers by queueItemId; also the synchronous double-click guard.
  const pending = React.useRef(new Map<string, number>());

  // The removed row takes focus with it: hand it to the row that took its
  // place (or the last one still staying), or to the list once none is left.
  // A fresh object per request so repeating an index still re-runs the effect.
  const [focusRequest, setFocusRequest] = React.useState<{
    index: number;
  } | null>(null);
  React.useEffect(() => {
    if (!focusRequest) return;
    const { index } = focusRequest;

    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      "[data-queue-remove]:not(:disabled)",
    );
    if (buttons?.length) {
      buttons[Math.min(index, buttons.length - 1)]?.focus();
    } else {
      listRef.current?.focus();
    }
  }, [focusRequest]);

  const commitRemoval = React.useCallback(
    (queueItemId: string) => {
      pending.current.delete(queueItemId);

      const { queue: current, currentIndex: playing } = latest.current;
      const index = current.findIndex(
        (item) => item.queueItemId === queueItemId,
      );
      if (index === -1) return;

      const next = removeFromQueue(current, playing, index);
      latest.current = { queue: next.queue, currentIndex: next.currentIndex };

      setQueue(next.queue);
      setCurrentIndex(next.currentIndex);
      setLeaving((ids) => {
        const rest = new Set(ids);
        rest.delete(queueItemId);
        return rest;
      });
      setFocusRequest({ index });
    },
    [setQueue, setCurrentIndex],
  );

  // The user already confirmed these removals, so closing the sheet mid-exit
  // must finish them now rather than drop them.
  React.useEffect(() => {
    const timers = pending.current;
    return () => {
      for (const [queueItemId, timer] of [...timers]) {
        window.clearTimeout(timer);
        commitRemoval(queueItemId);
      }
    };
  }, [commitRemoval]);

  function removeItem(queueItemId: string) {
    if (pending.current.has(queueItemId)) return;

    const song = latest.current.queue.find(
      (item) => item.queueItemId === queueItemId,
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No exit transition to wait for.
      pending.current.set(queueItemId, 0);
      commitRemoval(queueItemId);
    } else {
      setLeaving((ids) => new Set(ids).add(queueItemId));
      pending.current.set(
        queueItemId,
        window.setTimeout(() => commitRemoval(queueItemId), REMOVE_MS),
      );
    }

    if (song) {
      toast("Removed from queue", {
        description: `Removed "${song.name}" from the queue`,
        duration: 10000,
      });
    }
  }

  return { listRef, leaving, removeItem };
}
