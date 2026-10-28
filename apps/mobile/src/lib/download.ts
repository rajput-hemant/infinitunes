import type { QueueSource, StreamQuality } from "@infinitunes/types";
import { getDownloadCandidates, newQueueItemId } from "@infinitunes/types";
import { Directory, File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { Platform } from "react-native";

import {
  endBatch,
  finishSong,
  setSongProgress,
  startBatch,
  startSong,
} from "./download-store";
import { ensureNotificationPermission } from "./notifications";

type DownloadableTrack = Pick<
  QueueSource,
  "name" | "download_url" | "maxQuality"
> & {
  /** Marks the song's row while it downloads; leave out for none. */
  id?: string;
};

type TransferOptions = {
  signal?: AbortSignal;
  /** The fraction done, `null` while the server has not said how big it is. */
  onProgress?: (fraction: number | null) => void;
};

const MIME_TYPE = "audio/mp4";

/** A file name the file systems of both platforms accept, without extension. */
function baseNameFor(name: string): string {
  const kept = name.replace(/[^\p{L}\p{N} _-]+/gu, "").replace(/\s+/g, " ");
  return kept.trim() || "track";
}

/**
 * Asks for notification permission before a download begins, so the system
 * prompt never overlaps the share sheet or the work after it. It resolves
 * either way: a refusal or a failing prompt must not block the download.
 */
async function settleNotificationPermission() {
  try {
    await ensureNotificationPermission();
  } catch {
    // A notification is a courtesy; the download goes ahead without one.
  }
}

/** How long Android keeps a shared file for the receiving app to read it. */
const SHARED_FILE_GRACE_MS = 60_000;
const sharedAndroidFiles = new Set<File>();

function deleteQuietly(file: File) {
  try {
    file.delete();
  } catch {
    // The cache is the system's to purge; a leftover file is harmless.
  }
}

/**
 * The share sheet resolves when its chooser closes, but on Android the chosen
 * app may still be reading the file. Delete it after a grace period, or when
 * the next download starts, whichever comes first.
 */
function releaseSharedFile(file: File) {
  if (Platform.OS !== "android") {
    deleteQuietly(file);
    return;
  }
  sharedAndroidFiles.add(file);
  setTimeout(() => {
    if (sharedAndroidFiles.delete(file)) deleteQuietly(file);
  }, SHARED_FILE_GRACE_MS);
}

function sweepSharedFiles() {
  for (const file of sharedAndroidFiles) deleteQuietly(file);
  sharedAndroidFiles.clear();
}

/** `name.mp4`, or `name (2).mp4`, `name (3).mp4`... the first not in `taken`. */
function uniqueFileName(base: string, taken: Set<string>): string {
  let name = `${base}.mp4`;
  for (let n = 2; taken.has(name); n += 1) name = `${base} (${n}).mp4`;
  return name;
}

/** Shared bitrate fallback for explicit downloads and the playback cache. */
export async function downloadAudio(
  track: DownloadableTrack,
  quality: StreamQuality,
  destination: File,
  { signal, onProgress }: TransferOptions = {},
): Promise<{ file: File; source: string }> {
  let failure: unknown = new Error("This song can't be downloaded right now.");
  for (const source of getDownloadCandidates(
    track.download_url,
    quality,
    track.maxQuality,
  )) {
    try {
      const file = await File.downloadFileAsync(source, destination, {
        idempotent: true,
        ...(signal && { signal }),
        ...(onProgress && {
          onProgress: ({ bytesWritten, totalBytes }) =>
            onProgress(totalBytes > 0 ? bytesWritten / totalBytes : null),
        }),
      });
      return { file, source };
    } catch (error) {
      failure = error;
      // Android can leave a partial file after a failed transfer.
      if (destination.exists) destination.delete();
      // A cancelled transfer must not go on to the next bitrate.
      if (signal?.aborted) throw error;
    }
  }
  throw failure;
}

async function downloadToCache(
  track: DownloadableTrack,
  quality: StreamQuality,
  signal?: AbortSignal,
) {
  const temporaryName = `${baseNameFor(track.name)}-${newQueueItemId()}.mp4`;
  const { id } = track;
  const { file } = await downloadAudio(
    track,
    quality,
    new File(Paths.cache, temporaryName),
    {
      signal,
      onProgress: id === undefined ? undefined : (f) => setSongProgress(id, f),
    },
  );
  return file;
}

/**
 * Downloads a song at `quality` (capped at what it has) into the cache, then
 * hands it to the system share sheet, where the listener saves it to Files or
 * sends it on. Rejects when the song has no stream link or the CDN refuses.
 */
export async function downloadTrack(
  track: DownloadableTrack,
  quality: StreamQuality,
) {
  await settleNotificationPermission();
  sweepSharedFiles();
  startSong(track.id);
  let file: File;
  try {
    file = await downloadToCache(track, quality);
    finishSong(track.id, "saved");
  } catch (error) {
    finishSong(track.id, "failed");
    throw error;
  }
  try {
    await shareAsync(file.uri, {
      mimeType: MIME_TYPE,
      UTI: "public.mpeg-4-audio",
      dialogTitle: track.name,
    });
  } finally {
    releaseSharedFile(file);
  }
}

/**
 * Asks the listener for a folder to save into (Files on iOS, the storage
 * picker on Android); `null` when they dismiss it.
 */
export async function pickDownloadFolder(): Promise<Directory | null> {
  try {
    return await Directory.pickDirectoryAsync();
  } catch {
    return null;
  }
}

/** `cancelled` is set only when the listener stopped the run. */
export type SaveResult = {
  saved: number;
  failed: number;
  cancelled?: true;
};

/**
 * Saves every track into `folder`, one at a time (the web's "Download" of a
 * whole album or playlist). A track without a link or whose download fails
 * counts as failed; the rest still save. `cancelDownloads()` stops the run:
 * the song in flight is aborted, the rest never start, and neither counts as
 * failed.
 */
export async function saveTracks(
  folder: Directory,
  tracks: readonly DownloadableTrack[],
  quality: StreamQuality,
): Promise<SaveResult> {
  const result: SaveResult = { saved: 0, failed: 0 };
  // Started first, so the marks show while the permission prompt is up.
  const signal = startBatch(
    tracks.flatMap((track) => (track.id === undefined ? [] : [track.id])),
    tracks.length,
  );
  try {
    await settleNotificationPermission();
    // iOS's createFile throws on an existing file, so a second "Download all"
    // into the same folder would fail every track. Pick a free name instead
    // (Android's document provider renames on its own).
    const taken = new Set<string>();
    if (Platform.OS !== "android" && tracks.length > 0) {
      try {
        for (const entry of folder.list()) taken.add(entry.name);
      } catch {
        // Unreadable listing: fall back to the plain name.
      }
    }
    for (const track of tracks) {
      if (signal.aborted) break;
      startSong(track.id, signal);
      let cached: File | undefined;
      try {
        cached = await downloadToCache(track, quality, signal);
        if (signal.aborted) break;
        // Android's document provider appends the extension for the type.
        let name = baseNameFor(track.name);
        if (Platform.OS !== "android") {
          name = uniqueFileName(name, taken);
          taken.add(name);
        }
        const bytes = await cached.bytes();
        if (signal.aborted) break;
        const target = folder.createFile(name, MIME_TYPE);
        await target.write(bytes);
        result.saved += 1;
        finishSong(track.id, "saved", signal);
      } catch {
        // An aborted transfer is the listener's doing, not a failed song.
        if (signal.aborted) break;
        result.failed += 1;
        finishSong(track.id, "failed", signal);
      } finally {
        // A failed save must not leave the download behind in the cache.
        try {
          cached?.delete();
        } catch {
          // The cache is the system's to purge; a leftover file is harmless.
        }
      }
    }
  } finally {
    if (signal.aborted) result.cancelled = true;
    endBatch(signal);
  }
  return result;
}
