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

/** Above this many songs the user confirms first: each one is a separate file. */
const CONFIRM_ABOVE = 10;
const PROGRESS_TOAST = "download-progress";

/**
 * Downloads the songs one after another (each blob is released before the next
 * starts, and the browser is not asked for N save dialogs at once), reports
 * progress and any partial failure as toasts. `setBusy` brackets the run. Kept
 * outside the hook: the React Compiler bails out on try/finally.
 */
async function downloadAll(
  songs: Downloadable[],
  downloadSong: (song: Downloadable) => Promise<void>,
  setBusy: (busy: boolean) => void,
) {
  if (
    songs.length > CONFIRM_ABOVE &&
    !window.confirm(`Download ${songs.length} songs one by one?`)
  ) {
    return;
  }

  setBusy(true);
  let failed = 0;
  try {
    for (const [index, song] of songs.entries()) {
      if (songs.length > 1) {
        toast.loading(`Downloading ${index + 1} of ${songs.length}`, {
          id: PROGRESS_TOAST,
        });
      }
      try {
        await downloadSong(song);
      } catch (error) {
        console.error(error);
        failed++;
      }
    }
  } finally {
    setBusy(false);
  }

  if (songs.length === 1) {
    if (failed) toast.error("Download failed. Please try again.");
  } else if (failed === songs.length) {
    toast.error("Download failed. Please try again.", { id: PROGRESS_TOAST });
  } else if (failed) {
    toast.error(
      `Downloaded ${songs.length - failed} of ${songs.length} songs, ${failed} failed`,
      { id: PROGRESS_TOAST },
    );
  } else if (songs.length > 1) {
    toast.success(`Downloaded ${songs.length} songs`, { id: PROGRESS_TOAST });
  }
}

/** Downloads every song at the chosen quality; `isDownloading` disables the trigger meanwhile. */
export function useDownloadSongs(songs: Downloadable[]) {
  const [downloadQuality] = useDownloadQuality();
  const [isDownloading, setIsDownloading] = React.useState(false);

  async function downloadSong(song: Downloadable) {
    const raw = "more_info" in song;
    const link = getDownloadLink(
      raw
        ? (song.download_url ?? song.more_info.download_url ?? "")
        : song.download_url,
      downloadQuality,
      raw ? maxQualityOf(song.more_info) : song.maxQuality,
    );
    if (!link) return;

    const title = downloadTitle(song);
    const chunks = await readAudio(link);

    // A batch reports once at the end; a single song says its name.
    if (songs.length === 1) toast.success(`Downloaded ${title}`);
    saveBlob(new Blob(chunks, { type: "audio/mp4" }), `${title}.m4a`);
  }

  async function download() {
    await downloadAll(songs, downloadSong, setIsDownloading);
  }

  return { isDownloading, download };
}

export function DownloadButton({
  songs,
  className,
  ...rest
}: DownloadButtonProps) {
  const { isDownloading, download } = useDownloadSongs(songs);

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
