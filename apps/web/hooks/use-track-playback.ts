import {
  getDownloadLink,
  type Queue,
  type StreamQuality,
} from "@infinitunes/types";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { type PlayedItem } from "~/lib/history-actions";
import { playToRecord } from "~/lib/queue-position";

type LoadOptions = {
  html5: boolean;
  autoplay: boolean;
  initialMute: boolean;
  onend: () => void;
};

type TrackPlaybackOptions = {
  queue: Queue[];
  currentIndex: number;
  streamQuality: StreamQuality;
  isPlayerInit: boolean;
  load: (src: string, options: LoadOptions) => void;
  onEnd: () => void;
  record: (item: PlayedItem) => void;
};

/**
 * Loads the current queue entry and records it in the listening history.
 *
 * The effect is keyed on the entry (`queueItemId`) and its resolved source, not
 * on `queue`: `load` destroys and recreates the Howl, so keying on the array
 * would restart the playing track whenever anything is queued, removed or
 * radio-refilled. The entry id is part of the key so the same song queued
 * twice in a row still loads and records its second copy, while a quality
 * change (new source, same entry) reloads without a new listen.
 */
export function useTrackPlayback({
  queue,
  currentIndex,
  streamQuality,
  isPlayerInit,
  load,
  onEnd,
  record,
}: TrackPlaybackOptions) {
  const lastRecordedRef = useRef<string | null>(null);
  const track = queue[currentIndex];
  const audioSrc = track
    ? getDownloadLink(track.download_url, streamQuality)
    : "";
  const trackId = track?.id;
  const trackType = track?.type;
  const queueItemId = track?.queueItemId;

  useEffect(() => {
    if (!isPlayerInit || !queueItemId || !trackId) return;

    if (!audioSrc) {
      toast.error("This song can't be played right now.");
      return;
    }

    const play = playToRecord(
      { id: trackId, queueItemId, type: trackType },
      lastRecordedRef.current,
    );
    if (play) {
      lastRecordedRef.current = queueItemId;
      record(play);
    }

    load(audioSrc, {
      html5: true,
      autoplay: true,
      initialMute: false,
      onend: onEnd,
    });
  }, [
    audioSrc,
    isPlayerInit,
    load,
    onEnd,
    queueItemId,
    record,
    trackId,
    trackType,
  ]);
}
