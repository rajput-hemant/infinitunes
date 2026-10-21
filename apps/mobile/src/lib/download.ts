import type { QueueSource, StreamQuality } from "@infinitunes/types";
import { getDownloadLink } from "@infinitunes/types";
import { Directory, File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { Platform } from "react-native";

type DownloadableTrack = Pick<
  QueueSource,
  "name" | "download_url" | "maxQuality"
>;

const MIME_TYPE = "audio/mp4";

/** A file name the file systems of both platforms accept, without extension. */
function baseNameFor(name: string): string {
  const kept = name.replace(/[^\p{L}\p{N} _-]+/gu, "").replace(/\s+/g, " ");
  return kept.trim() || "track";
}

function fileNameFor(name: string): string {
  return `${baseNameFor(name)}.mp4`;
}

/** Downloads the track's link at `quality` into the cache; rejects without one. */
async function downloadToCache(
  track: DownloadableTrack,
  quality: StreamQuality,
): Promise<File> {
  const link = getDownloadLink(track.download_url, quality, track.maxQuality);
  if (!link) throw new Error("This song can't be downloaded right now.");
  return File.downloadFileAsync(
    link,
    new File(Paths.cache, fileNameFor(track.name)),
    { idempotent: true },
  );
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
  const file = await downloadToCache(track, quality);
  await shareAsync(file.uri, {
    mimeType: MIME_TYPE,
    UTI: "public.mpeg-4-audio",
    dialogTitle: track.name,
  });
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

export type SaveResult = { saved: number; failed: number };

/**
 * Saves every track into `folder`, one at a time (the web's "Download" of a
 * whole album or playlist). A track without a link or whose download fails
 * counts as failed; the rest still save.
 */
export async function saveTracks(
  folder: Directory,
  tracks: readonly DownloadableTrack[],
  quality: StreamQuality,
): Promise<SaveResult> {
  const result: SaveResult = { saved: 0, failed: 0 };
  for (const track of tracks) {
    let cached: File | undefined;
    try {
      cached = await downloadToCache(track, quality);
      // Android's document provider appends the extension for the type.
      const target = folder.createFile(
        Platform.OS === "android"
          ? baseNameFor(track.name)
          : fileNameFor(track.name),
        MIME_TYPE,
      );
      await target.write(await cached.bytes());
      result.saved += 1;
    } catch {
      result.failed += 1;
    } finally {
      // A failed save must not leave the download behind in the cache.
      try {
        cached?.delete();
      } catch {
        // The cache is the system's to purge; a leftover file is harmless.
      }
    }
  }
  return result;
}
