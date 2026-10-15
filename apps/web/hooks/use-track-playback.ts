import {
  getDownloadCandidates,
  type Queue,
  type StreamQuality,
} from "@infinitunes/types";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { type PlayedItem } from "~/lib/history-actions";
import { playToRecord } from "~/lib/queue-position";

/** Tracks in a row that may fail to load before playback stops. */
const MAX_CONSECUTIVE_FAILURES = 2;

type LoadOptions = {
  html5: boolean;
  loop: boolean;
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
  /** The player's load error for the current source (reset by every load). */
  loadError?: string;
  /** Whether repeat-one is on, so it survives the switch to the next track. */
  isLooping?: boolean;
  /** True once the current source has loaded; ends a run of failures. */
  isReady?: boolean;
  /** Every bitrate of the current entry failed to load. */
  onUnplayable?: () => void;
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
  loadError,
  isLooping = false,
  isReady = false,
  onUnplayable,
}: TrackPlaybackOptions) {
  const lastRecordedRef = useRef<string | null>(null);
  const notifiedRef = useRef<string | null>(null);
  const loopRef = useRef(isLooping);
  const unplayableRef = useRef(onUnplayable);
  // Consecutive entries that failed on every bitrate, and whether the next
  // entry change is our own skip (anything else is the listener acting).
  const failuresRef = useRef(0);
  const expectSkipRef = useRef(false);
  useEffect(() => {
    loopRef.current = isLooping;
    unplayableRef.current = onUnplayable;
  });
  // How many of this entry's bitrates have failed to load, so the next one down
  // is tried. Keyed by the entry, so it never leaks onto another track.
  const [failure, setFailure] = useState<{ id: string; tried: number } | null>(
    null,
  );
  const track = queue[currentIndex];
  const candidates = track
    ? getDownloadCandidates(track.download_url, streamQuality, track.maxQuality)
    : [];
  const trackId = track?.id;
  const trackType = track?.type;
  const queueItemId = track?.queueItemId;
  const tried = failure && failure.id === queueItemId ? failure.tried : 0;
  const exhausted = candidates.length > 0 && tried >= candidates.length;
  const audioSrc = candidates[tried] ?? "";

  // Adjusting state while rendering: another entry starts with a clean slate,
  // so coming back to this one later tries its best bitrate again.
  const [seenItem, setSeenItem] = useState(queueItemId);
  if (seenItem !== queueItemId) {
    setSeenItem(queueItemId);
    setFailure(null);
  }

  // Only a new error counts: the previous track's error stays set until the
  // next load starts, and must not be charged to the track that follows it.
  const currentItemRef = useRef(queueItemId);
  useEffect(() => {
    currentItemRef.current = queueItemId;
  });
  useEffect(() => {
    const id = currentItemRef.current;
    if (!loadError || !id) return;
    setFailure((prev) => ({
      id,
      tried: (prev && prev.id === id ? prev.tried : 0) + 1,
    }));
  }, [loadError]);

  useEffect(() => {
    if (!queueItemId) return;
    if (expectSkipRef.current) expectSkipRef.current = false;
    else failuresRef.current = 0;
  }, [queueItemId]);

  useEffect(() => {
    if (isReady) failuresRef.current = 0;
  }, [isReady]);

  useEffect(() => {
    if (!exhausted || !queueItemId) {
      notifiedRef.current = null;
      return;
    }
    if (notifiedRef.current === queueItemId) return;
    notifiedRef.current = queueItemId;
    failuresRef.current += 1;
    if (failuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
      // Offline or the CDN is down: stop on this track instead of working
      // through the whole queue.
      toast.error(
        "Can't reach the music server. Check your connection and try again.",
      );
      return;
    }
    toast.error("Couldn't play this song");
    expectSkipRef.current = true;
    unplayableRef.current?.();
  }, [exhausted, queueItemId]);

  useEffect(() => {
    if (!isPlayerInit || !queueItemId || !trackId) return;

    if (exhausted) return;

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
      loop: loopRef.current,
      autoplay: true,
      initialMute: false,
      onend: onEnd,
    });
  }, [
    audioSrc,
    exhausted,
    isPlayerInit,
    load,
    onEnd,
    queueItemId,
    record,
    trackId,
    trackType,
  ]);
}
