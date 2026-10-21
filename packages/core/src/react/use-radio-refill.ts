import type { ActiveRadioSession, Queue, Song } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { useEffect, useRef, useState } from "react";

const REFILL_THRESHOLD = 3;

/** Delay before retrying a refill that failed or brought nothing new; doubles per attempt. */
export const REFILL_RETRY_BASE_MS = 2_000;
const REFILL_RETRY_MAX_MS = 60_000;

type RadioRefillOptions = {
  activeRadio: ActiveRadioSession | null;
  queue: Queue[];
  currentIndex: number;
  fetchSongs: (stationId: string) => Promise<Song[]>;
  setQueue: (update: (prev: Queue[]) => Queue[]) => void;
};

/** Failed refills in a row for one station; a new station starts at zero. */
type RetryState = { stationId: string; attempt: number } | null;

/**
 * Appends a fresh batch from the active radio station when playback nears the
 * end of the queue. A refill that fails, or brings only songs already queued,
 * is retried with a capped exponential backoff: playback can sit on the last
 * entry, where nothing else would run the refill again.
 */
export function useRadioRefill({
  activeRadio,
  queue,
  currentIndex,
  fetchSongs,
  setQueue,
}: RadioRefillOptions) {
  // Station whose batch is in flight; a new station refills independently.
  const refillingRef = useRef<string | null>(null);
  const stationRef = useRef<string>(undefined);
  const queueRef = useRef(queue);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [retry, setRetry] = useState<RetryState>(null);
  const activeStationId = activeRadio?.stationId;
  const attempt =
    retry && retry.stationId === activeStationId ? retry.attempt : 0;

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    stationRef.current = activeStationId;
    // A pending retry belongs to the station that scheduled it.
    return () => {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
    };
  }, [activeStationId]);

  useEffect(() => {
    if (!activeRadio || queue.length === 0) return;
    const { stationId } = activeRadio;
    if (refillingRef.current === stationId) return;
    if (currentIndex < queue.length - REFILL_THRESHOLD) return;

    const scheduleRetry = () => {
      clearTimeout(retryTimerRef.current);
      const delay = Math.min(
        REFILL_RETRY_BASE_MS * 2 ** attempt,
        REFILL_RETRY_MAX_MS,
      );
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = undefined;
        setRetry((prev) => ({
          stationId,
          attempt: (prev?.stationId === stationId ? prev.attempt : 0) + 1,
        }));
      }, delay);
    };

    // This fetch supersedes a pending retry.
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = undefined;
    refillingRef.current = stationId;
    fetchSongs(stationId)
      .then((moreSongs) => {
        // The station changed (or stopped) while the batch was in flight.
        if (stationRef.current !== stationId) return;
        const queuedIds = new Set(queueRef.current.map((s) => s.id));
        if (!moreSongs.some((s) => !queuedIds.has(s.id))) {
          scheduleRetry();
          return;
        }
        setRetry(null);
        setQueue((prev) => {
          const prevIds = new Set(prev.map((s) => s.id));
          const newItems = moreSongs
            .filter((s) => !prevIds.has(s.id))
            .map(toQueue);
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      })
      .catch(() => {
        if (stationRef.current === stationId) scheduleRetry();
      })
      .finally(() => {
        if (refillingRef.current === stationId) refillingRef.current = null;
      });
  }, [currentIndex, queue, activeRadio, fetchSongs, setQueue, attempt]);
}
