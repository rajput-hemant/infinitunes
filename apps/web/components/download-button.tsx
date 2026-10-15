"use client";

import type { Episode, Song } from "@infinitunes/types";
import { QUALITIES_MAP, decode } from "@infinitunes/types";
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

type DownloadButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  songs: (Song | Episode)[];
};

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

/**
 * Runs every download and reports a failure as a toast. `setBusy` brackets the
 * run. Kept outside the hook: the React Compiler bails out on try/finally.
 */
async function downloadAll(
  songs: (Song | Episode)[],
  downloadSong: (song: Song | Episode) => Promise<void>,
  setBusy: (busy: boolean) => void,
) {
  setBusy(true);
  try {
    await Promise.all(songs.map((song) => downloadSong(song)));
  } catch (error) {
    console.error(error);
    toast.error("Download failed. Please try again.");
  } finally {
    setBusy(false);
  }
}

/** Downloads every song at the chosen quality; `isDownloading` disables the trigger meanwhile. */
export function useDownloadSongs(songs: (Song | Episode)[]) {
  const [downloadQuality] = useDownloadQuality();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadQualityIndex = QUALITIES_MAP.findIndex(
    ({ quality }) => quality === downloadQuality,
  );

  async function downloadSong(song: Song | Episode) {
    const links = (song.download_url ?? song.more_info.download_url ?? "")
      .split(",")
      .filter(Boolean);
    const link = links[downloadQualityIndex] ?? links[0];
    if (!link) return;

    const title = decode(song.title);
    const chunks = await readAudio(link);

    toast.success(`Downloaded ${title}`);
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
          ? `Download \`${songs[0]?.title ?? ""}\``
          : `Download ${songs.length} songs`}
      </TooltipContent>
    </Tooltip>
  );
}
