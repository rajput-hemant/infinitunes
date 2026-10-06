import type { ActiveRadioSession, Queue, Song } from "@infinitunes/types";
import { toQueue } from "@infinitunes/types";
import { useEffect, useRef } from "react";

const REFILL_THRESHOLD = 3;

type RadioRefillOptions = {
  activeRadio: ActiveRadioSession | null;
  queue: Queue[];
  currentIndex: number;
  fetchSongs: (stationId: string) => Promise<Song[]>;
  setQueue: (update: (prev: Queue[]) => Queue[]) => void;
};

/** Appends a fresh batch from the active radio station when playback nears the end of the queue. */
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
  const activeStationId = activeRadio?.stationId;

  useEffect(() => {
    stationRef.current = activeStationId;
  }, [activeStationId]);

  useEffect(() => {
    if (!activeRadio || queue.length === 0) return;
    const { stationId } = activeRadio;
    if (refillingRef.current === stationId) return;
    if (currentIndex >= queue.length - REFILL_THRESHOLD) {
      refillingRef.current = stationId;
      fetchSongs(stationId)
        .then((moreSongs) => {
          // The station changed (or stopped) while the batch was in flight.
          if (stationRef.current !== stationId) return;
          setQueue((prev) => {
            const queuedIds = new Set(prev.map((s) => s.id));
            const newItems = moreSongs
              .filter((s) => !queuedIds.has(s.id))
              .map(toQueue);
            return newItems.length > 0 ? [...prev, ...newItems] : prev;
          });
        })
        .catch(() => {
          // Ignore transient background refill glitches
        })
        .finally(() => {
          if (refillingRef.current === stationId) refillingRef.current = null;
        });
    }
  }, [currentIndex, queue, activeRadio, fetchSongs, setQueue]);
}
