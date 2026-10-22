import type { Queue, StreamQuality } from "@infinitunes/types";
import { getDownloadCandidates, newQueueItemId } from "@infinitunes/types";
import { Directory, File, Paths } from "expo-file-system";
import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { downloadAudio } from "./download";
import { persistedStorage } from "./persisted-storage";
import { preferencesStore } from "./preferences";

export const SONG_CACHE_LIMIT = 500 * 1024 * 1024;
const directory = () => new Directory(Paths.cache, "frequent-songs");

type CachedSong = {
  filename: string;
  source: string;
  size: number;
  lastPlayed: number;
};
type CacheState = {
  songs: Record<string, CachedSong>;
  listens: Record<string, { count: number; lastPlayed: number }>;
};

export const songCacheStore = createStore<CacheState>()(
  persist(() => ({ songs: {}, listens: {} }), {
    name: "song-cache",
    storage: persistedStorage<CacheState>(),
  }),
);

let work = Promise.resolve();
let generation = 0;
function serialized<T>(operation: () => Promise<T> | T): Promise<T> {
  const result = work.then(operation);
  work = result.then(
    () => {},
    () => {},
  );
  return result;
}

function removeSong(id: string) {
  const { songs } = songCacheStore.getState();
  const song = songs[id];
  if (!song) return;
  const file = new File(directory(), song.filename);
  if (file.exists) file.delete();
  const next = { ...songs };
  delete next[id];
  songCacheStore.setState({ songs: next });
}

/** Reconcile OS-purged files and interrupted downloads against actual disk sizes. */
export function refreshSongCache() {
  const { songs } = songCacheStore.getState();
  const next: CacheState["songs"] = {};
  const kept = new Set<string>();
  for (const [id, song] of Object.entries(songs)) {
    const file = new File(directory(), song.filename);
    if (file.exists && file.size > 0) {
      next[id] = { ...song, size: file.size };
      kept.add(song.filename);
    }
  }
  const dir = directory();
  if (dir.exists) {
    for (const file of dir.list()) {
      if (!kept.has(file.name)) file.delete();
    }
  }
  songCacheStore.setState({ songs: next });
}

export const cacheBytes = (songs: CacheState["songs"]) =>
  Object.values(songs).reduce((sum, song) => sum + song.size, 0);

export function useSongCacheBytes() {
  return useStore(songCacheStore, (state) => cacheBytes(state.songs));
}

export function formatCacheSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** Two distinct listens of at least half the song; seeking alone does not qualify. */
export function createCacheListenTracker() {
  let entry: string | undefined;
  let previous = 0;
  let heard = 0;
  let counted = false;
  return (
    track: Queue,
    position: number,
    duration: number,
    playing: boolean,
    ended: boolean,
  ) => {
    if (entry !== track.queueItemId) {
      entry = track.queueItemId;
      previous = 0;
      heard = 0;
      counted = false;
    }
    const delta = position - previous;
    if (playing && delta > 0 && delta <= 1) heard += delta;
    previous = position;
    const qualifies = !counted && duration > 0 && heard >= duration / 2;
    if (qualifies) counted = true;
    if (ended || delta < -1) {
      previous = 0;
      heard = 0;
      counted = false;
    }
    return qualifies;
  };
}

export function cacheQualifiedListen(track: Queue, quality: StreamQuality) {
  if (track.type !== "song" || !preferencesStore.getState().cacheFrequentSongs)
    return Promise.resolve();
  const { listens } = songCacheStore.getState();
  // Bound metadata too; the most recent 1,000 songs are enough to find repeats.
  const next = Object.fromEntries(
    Object.entries({
      ...listens,
      [track.id]: {
        count: Math.min(2, (listens[track.id]?.count ?? 0) + 1),
        lastPlayed: Date.now(),
      },
    })
      .sort((a, b) => b[1].lastPlayed - a[1].lastPlayed)
      .slice(0, 1000),
  );
  songCacheStore.setState({ listens: next });
  if ((next[track.id]?.count ?? 0) < 2) return Promise.resolve();
  const requestedGeneration = generation;
  return serialized(async () => {
    if (
      generation !== requestedGeneration ||
      !preferencesStore.getState().cacheFrequentSongs
    )
      return;
    refreshSongCache();
    const candidates = getDownloadCandidates(
      track.download_url,
      quality,
      track.maxQuality,
    );
    const existing = songCacheStore.getState().songs[track.id];
    if (existing && candidates.includes(existing.source)) return;
    directory().create({ idempotent: true, intermediates: true });
    // Clear and downloads share this queue; no stale completion can repopulate a clear.
    const filename = `${encodeURIComponent(track.id)}-${newQueueItemId()}.mp4`;
    const target = new File(directory(), filename);
    try {
      const { file, source } = await downloadAudio(track, quality, target);
      if (
        generation !== requestedGeneration ||
        !preferencesStore.getState().cacheFrequentSongs ||
        file.size <= 0 ||
        file.size > SONG_CACHE_LIMIT
      ) {
        if (file.exists) file.delete();
        return;
      }
      removeSong(track.id);
      for (const [id] of Object.entries(songCacheStore.getState().songs).sort(
        (a, b) => a[1].lastPlayed - b[1].lastPlayed,
      )) {
        if (
          cacheBytes(songCacheStore.getState().songs) + file.size <=
          SONG_CACHE_LIMIT
        )
          break;
        removeSong(id);
      }
      songCacheStore.setState(({ songs }) => ({
        songs: {
          ...songs,
          [track.id]: {
            filename,
            source,
            size: file.size,
            lastPlayed: Date.now(),
          },
        },
      }));
    } finally {
      if (
        !Object.values(songCacheStore.getState().songs).some(
          (song) => song.filename === filename,
        ) &&
        target.exists
      )
        target.delete();
    }
  }).catch(() => {
    // Caching is optional; a disk or network failure must not interrupt playback.
  });
}

/** Use a cached candidate at or below the requested stream bitrate. */
export function cachedSongSource(
  track: Queue,
  source: string,
): string | undefined {
  if (!preferencesStore.getState().cacheFrequentSongs) return;
  const song = songCacheStore.getState().songs[track.id];
  if (!song) return;
  const candidates = getDownloadCandidates(
    track.download_url,
    preferencesStore.getState().streamQuality,
    track.maxQuality,
  );
  const requested = candidates.indexOf(source);
  const cached = candidates.indexOf(song.source);
  songCacheStore.setState(({ songs }) => ({
    songs: { ...songs, [track.id]: { ...song, lastPlayed: Date.now() } },
  }));
  if (requested < 0 || cached < requested) return;
  try {
    const file = new File(directory(), song.filename);
    if (!file.exists || file.size <= 0) {
      removeSong(track.id);
      return;
    }
    return file.uri;
  } catch {
    return;
  }
}

export function evictCachedSong(id: string) {
  try {
    removeSong(id);
  } catch {
    // Never keep selecting an unreadable file, even if deletion was denied.
    const songs = { ...songCacheStore.getState().songs };
    delete songs[id];
    songCacheStore.setState({ songs });
  }
}

export function clearSongCache(): Promise<number> {
  generation += 1;
  return serialized(() => {
    const dir = directory();
    const freed = dir.exists ? (dir.size ?? 0) : 0;
    if (dir.exists) dir.delete();
    songCacheStore.setState({ songs: {}, listens: {} });
    return freed;
  });
}

export function refreshSongCacheSize() {
  return serialized(refreshSongCache);
}
