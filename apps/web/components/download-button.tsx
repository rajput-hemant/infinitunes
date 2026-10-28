"use client";

import type { Episode, Song, SongRowItem } from "@infinitunes/types";
import { decode, getDownloadLink, maxQualityOf } from "@infinitunes/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { CloudDownload, Loader } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { useDownloadQuality } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

/** A raw catalog song or episode, or a slim row (already decoded, with its quality cap). */
type Downloadable = Song | Episode | SongRowItem;

type DownloadButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  songs: Downloadable[];
  /** Names the ZIP when there is more than one song. */
  name?: string;
};

function downloadTitle(song: Downloadable): string {
  return "more_info" in song ? decode(song.title) : song.name;
}

/** Streams a song's audio into memory; throws when the download is not served. */
export async function readAudio(link: string): Promise<BlobPart[]> {
  const response = await fetch(link);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];

  for (;;) {
    const result = await reader.read();
    if (result.done) return chunks;
    chunks.push(result.value);
  }
}

/** Hands a blob to the browser as a file download. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  // Revoke only after the browser has started the download from the click.
  anchor.addEventListener(
    "click",
    () => setTimeout(() => URL.revokeObjectURL(url), 150),
    { once: true },
  );

  anchor.click();
}

const PROGRESS_TOAST = "download-progress";
const FAILED_MESSAGE = "Download failed. Please try again.";

/** A file name every filesystem accepts: no separators or reserved characters, no trailing dots. */
function safeName(name: string): string {
  const clean = name
    // oxlint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|[. ]+$/g, "")
    .slice(0, 120)
    .trim();
  return clean || "Download";
}

function downloadArtists(song: Downloadable): string {
  const credits =
    "more_info" in song
      ? (song.more_info.artistMap?.primary_artists ?? [])
      : song.primaryArtists;
  return credits.map((artist) => decode(artist.name)).join(", ");
}

type StreamQuality = Parameters<typeof getDownloadLink>[1];

/** Fetches one song's audio; throws when there is no link or it is not served. */
async function fetchSong(song: Downloadable, quality: StreamQuality) {
  const raw = "more_info" in song;
  const link = getDownloadLink(
    raw
      ? (song.download_url ?? song.more_info.download_url ?? "")
      : song.download_url,
    quality,
    raw ? maxQualityOf(song.more_info) : song.maxQuality,
  );
  if (!link) throw new Error("No download link");

  // The CDN serves AAC in an MP4 container, hence `.m4a`.
  return new Blob(await readAudio(link), { type: "audio/mp4" });
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<FileSystemWritableFileStream> }>;

/**
 * Asks where to save the archive when the browser can stream to disk (File
 * System Access API). `undefined` means unsupported (the caller builds a blob
 * instead); `null` means the user cancelled the picker.
 */
async function pickZipTarget(filename: string) {
  const pick = (window as { showSaveFilePicker?: SaveFilePicker })
    .showSaveFilePicker;
  if (!pick) return undefined;
  try {
    return await pick.call(window, {
      suggestedName: filename,
      types: [
        { description: "ZIP archive", accept: { "application/zip": [".zip"] } },
      ],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    return undefined;
  }
}

/**
 * One file for every song: a single song is saved as is, several become one
 * stored (uncompressed, audio is already compressed) ZIP, numbered in list
 * order. Songs are fetched one at a time (only one is in memory) and a failed
 * one is skipped. With the File System Access API the archive streams to disk,
 * else it is built as a blob. Progress and partial failure are toasts;
 * `setBusy` brackets the run. Kept outside the hook: the React Compiler bails
 * out on try/finally.
 */
async function downloadAll(
  songs: Downloadable[],
  collection: string,
  quality: StreamQuality,
  setBusy: (busy: boolean) => void,
) {
  const [only] = songs;
  if (songs.length === 1 && only) {
    setBusy(true);
    try {
      const title = downloadTitle(only);
      const artists = downloadArtists(only);
      const blob = await fetchSong(only, quality);
      saveBlob(
        blob,
        `${safeName(artists ? `${artists} - ${title}` : title)}.m4a`,
      );
      toast.success(`Downloaded ${title}`);
    } catch (error) {
      console.error(error);
      toast.error(FAILED_MESSAGE);
    } finally {
      setBusy(false);
    }
    return;
  }

  const archive = `${safeName(collection)}.zip`;
  // Must run before any await: the picker needs the click's user activation.
  const target = await pickZipTarget(archive);
  if (target === null) return;

  setBusy(true);
  let failed = 0;
  try {
    const { makeZip } = await import("client-zip");
    const width = Math.max(2, String(songs.length).length);

    async function* entries() {
      for (const [index, song] of songs.entries()) {
        toast.loading(`Downloading ${index + 1} of ${songs.length}`, {
          id: PROGRESS_TOAST,
        });
        try {
          const input = await fetchSong(song, quality);
          const number = String(index + 1).padStart(width, "0");
          yield {
            name: `${number} - ${safeName(downloadTitle(song))}.m4a`,
            input,
          };
        } catch (error) {
          console.error(error);
          failed++;
        }
      }
    }

    const zip = makeZip(entries());
    const succeeded = () => songs.length - failed;

    if (target) {
      const writable = await target.createWritable();
      const reader = zip.getReader();
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          await writable.write(chunk.value);
        }
      } catch (error) {
        await writable.abort();
        throw error;
      }
      // Nothing to keep: drop the swap file instead of leaving an empty archive.
      if (succeeded() === 0) await writable.abort();
      else await writable.close();
    } else {
      const blob = await new Response(zip).blob();
      if (succeeded() > 0) saveBlob(blob, archive);
    }
  } catch (error) {
    console.error(error);
    failed = songs.length;
  } finally {
    setBusy(false);
  }

  if (failed === songs.length) {
    toast.error(FAILED_MESSAGE, { id: PROGRESS_TOAST });
  } else if (failed) {
    toast.error(
      `Downloaded ${songs.length - failed} of ${songs.length} songs, ${failed} failed`,
      { id: PROGRESS_TOAST },
    );
  } else {
    toast.success(`Downloaded ${songs.length} songs`, { id: PROGRESS_TOAST });
  }
}

/**
 * Downloads the songs at the chosen quality (one file, or one ZIP named
 * `collection` for several); `isDownloading` disables the trigger meanwhile.
 */
export function useDownloadSongs(songs: Downloadable[], collection = "Songs") {
  const [downloadQuality] = useDownloadQuality();
  const [isDownloading, setIsDownloading] = React.useState(false);

  async function download() {
    await downloadAll(songs, collection, downloadQuality, setIsDownloading);
  }

  return { isDownloading, download };
}

export function DownloadButton({
  songs,
  name,
  className,
  ...rest
}: DownloadButtonProps) {
  const { isDownloading, download } = useDownloadSongs(songs, name);

  // "Download 0 songs" is a dead control.
  if (songs.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        aria-label={`Download ${songs.length} song${songs.length === 1 ? "" : "s"}`}
        onClick={download}
        className={cn(
          controlStyles.rowIcon,
          "inline-flex items-center justify-center text-muted-foreground outline-hidden transition-colors duration-fast hover:bg-fill hover:text-foreground active:bg-fill-2 focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...rest}
        disabled={isDownloading}
      >
        <span className="relative size-4.5">
          <CloudDownload
            aria-hidden
            className={cn(
              "absolute inset-0 size-4.5 transition-[opacity,scale] duration-fast ease-out",
              isDownloading && "scale-80 opacity-0",
            )}
          />
          <Loader
            aria-hidden
            className={cn(
              "absolute inset-0 size-4.5 transition-[opacity,scale] duration-fast ease-out",
              isDownloading ? "animate-spin" : "scale-80 opacity-0",
            )}
          />
        </span>
      </TooltipTrigger>

      <TooltipContent>
        {songs.length === 1
          ? `Download \`${songs[0] ? downloadTitle(songs[0]) : ""}\``
          : `Download ${songs.length} songs`}
      </TooltipContent>
    </Tooltip>
  );
}
