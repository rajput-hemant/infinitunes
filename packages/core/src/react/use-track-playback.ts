import {
  getDownloadCandidates,
  type Queue,
  type StreamQuality,
} from "@infinitunes/types";
import { useEffect, useRef, useState } from "react";

import { playToRecord, type PlayedItem } from "../queue-position";

/** Tracks in a row that may fail to load before playback stops. */
const MAX_CONSECUTIVE_FAILURES = 2;

/**
 * Why the current entry did not start. `no-source`: it has no stream link
 * (e.g. the server has no media key). `unplayable`: every bitrate failed and
 * the player skips it. `unreachable`: two entries in a row failed, so playback
 * stops on this one instead of working through the whole queue.
 */
export type PlaybackProblem = "no-source" | "unplayable" | "unreachable";

/** What each app tells the listener for a `PlaybackProblem`. */
export const PLAYBACK_PROBLEM_MESSAGES: Record<PlaybackProblem, string> = {
  "no-source": "This song can't be played right now.",
  unplayable: "Couldn't play this song",
  unreachable:
    "Can't reach the music server. Check your connection and try again.",
};

/** Loads `src` into the audio engine and starts it. */
export type LoadTrack = (src: string, options: { loop: boolean }) => void;

type TrackPlaybackOptions = {
  queue: Queue[];
  currentIndex: number;
  streamQuality: StreamQuality;
  isPlayerInit: boolean;
  load: LoadTrack;
  record: (item: PlayedItem) => void;
  /** Reports a problem with the current entry; the app shows the message. */
  onProblem: (problem: PlaybackProblem) => void;
  /** The engine's load error for the current source (reset by every load). */
  loadError?: string;
  /** Whether repeat-one is on, so it survives the switch to the next track. */
  isLooping?: boolean;
  /** True once the current source has loaded; ends a run of failures. */
  isReady?: boolean;
  /** Every bitrate of the current entry failed to load. */
  onUnplayable?: () => void;
  /** Bump to try the current entry again after a problem (Play with nothing loaded). */
  retry?: number;
};

/**
 * Loads the current queue entry and records it in the listening history,
 * stepping down a bitrate on each load error (`getDownloadCandidates`) and
 * never loading an empty source.
 *
 * The effect is keyed on the entry (`queueItemId`) and its resolved source, not
 * on `queue`: `load` replaces the engine's source, so keying on the array
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
  record,
  onProblem,
  loadError,
  isLooping = false,
  isReady = false,
  onUnplayable,
  retry = 0,
}: TrackPlaybackOptions) {
  const lastRecordedRef = useRef<string | null>(null);
  const notifiedRef = useRef<string | null>(null);
  const pendingListenRef = useRef<{ key: string; notReady: boolean } | null>(
    null,
  );
  const loopRef = useRef(isLooping);
  const unplayableRef = useRef(onUnplayable);
  const problemRef = useRef(onProblem);
  // Consecutive entries that failed on every bitrate, and whether the next
  // entry change is our own skip (anything else is the listener acting).
  const failuresRef = useRef(0);
  const expectSkipRef = useRef(false);
  const isReadyRef = useRef(isReady);
  useEffect(() => {
    isReadyRef.current = isReady;
    loopRef.current = isLooping;
    unplayableRef.current = onUnplayable;
    problemRef.current = onProblem;
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
  // A retry starts the entry's bitrate ladder over, like a new entry.
  const attemptKey = queueItemId && `${queueItemId}:${retry}`;
  const tried = failure && failure.id === attemptKey ? failure.tried : 0;
  const exhausted = candidates.length > 0 && tried >= candidates.length;
  const audioSrc = candidates[tried] ?? "";

  // Adjusting state while rendering: another entry starts with a clean slate,
  // so coming back to this one later tries its best bitrate again.
  const [seenItem, setSeenItem] = useState(attemptKey);
  if (seenItem !== attemptKey) {
    setSeenItem(attemptKey);
    setFailure(null);
  }

  // Only a new error counts: the previous track's error stays set until the
  // next load starts, and must not be charged to the track that follows it.
  const currentItemRef = useRef(attemptKey);
  useEffect(() => {
    currentItemRef.current = attemptKey;
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
      problemRef.current("unreachable");
      return;
    }
    problemRef.current("unplayable");
    expectSkipRef.current = true;
    unplayableRef.current?.();
  }, [exhausted, queueItemId]);

  useEffect(() => {
    if (!isPlayerInit || !queueItemId || !trackId) return;

    if (exhausted) return;

    if (!audioSrc) {
      problemRef.current("no-source");
      return;
    }

    // A render that still carries the previous source's `isReady` arms nothing.
    pendingListenRef.current = {
      key: attemptKey ?? "",
      notReady: !isReadyRef.current,
    };
    load(audioSrc, { loop: loopRef.current });
  }, [
    attemptKey,
    audioSrc,
    exhausted,
    isPlayerInit,
    load,
    queueItemId,
    trackId,
  ]);

  // A listen counts when `isReady` rises after `load()` was called for the
  // entry: the render that calls `load` still carries the previous source's
  // `isReady`, which must not record a track that then fails to load.
  useEffect(() => {
    const pending = pendingListenRef.current;
    if (!pending || pending.key !== attemptKey || !queueItemId || !trackId) {
      return;
    }
    if (!isReady) {
      pending.notReady = true;
      return;
    }
    if (!pending.notReady) return;
    pendingListenRef.current = null;
    const play = playToRecord(
      { id: trackId, queueItemId, type: trackType },
      lastRecordedRef.current,
    );
    if (!play) return;
    lastRecordedRef.current = queueItemId;
    record(play);
  }, [attemptKey, isReady, queueItemId, record, trackId, trackType]);
}
