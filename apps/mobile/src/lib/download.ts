import type { QueueSource, StreamQuality } from "@infinitunes/types";
import { getDownloadLink } from "@infinitunes/types";
import { File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";

/** A file name the file systems of both platforms accept. */
function fileNameFor(name: string): string {
  return `${name.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "track"}.mp4`;
}

/**
 * Downloads a song at `quality` (capped at what it has) into the cache, then
 * hands it to the system share sheet, where the listener saves it to Files or
 * sends it on. Rejects when the song has no stream link or the CDN refuses.
 */
export async function downloadTrack(
  track: Pick<QueueSource, "name" | "download_url" | "maxQuality">,
  quality: StreamQuality,
) {
  const link = getDownloadLink(track.download_url, quality, track.maxQuality);
  if (!link) throw new Error("This song can't be downloaded right now.");
  const file = await File.downloadFileAsync(
    link,
    new File(Paths.cache, fileNameFor(track.name)),
    { idempotent: true },
  );
  await shareAsync(file.uri, {
    mimeType: "audio/mp4",
    UTI: "public.mpeg-4-audio",
    dialogTitle: track.name,
  });
}
