"use client";

import type { Episode, Song, SongRowItem } from "@infinitunes/types";
import { decode, getDownloadLink, maxQualityOf } from "@infinitunes/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { CloudDownload } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { DownloadRing } from "~/components/download-ring";
import { useDownloadQuality } from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import type { DownloadJob, DownloadSummary } from "~/lib/download-store";
import {
  cancelBatch,
  enqueueDownloads,
  useBatchDone,
  useBatchFraction,
  useBatchTotal,
  useDownloads,
} from "~/lib/download-store";
import { cn } from "~/lib/utils";

/** A raw catalog song or episode, or a slim row (already decoded, with its quality cap). */
type Downloadable = Song | Episode | SongRowItem;

type DownloadButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  songs: Downloadable[];
};

function downloadTitle(song: Downloadable): string {
  return "more_info" in song ? decode(song.title) : song.name;
}

/**
 * Streams a song's audio into memory; throws when the download is not served.
 * `onProgress` gets 0..1 as bytes arrive, or `null` when the size is unknown.
 */
export async function readAudio(
  link: string,
  signal?: AbortSignal,
  onProgress?: (fraction: number | null) => void,
): Promise<BlobPart[]> {
  const response = await fetch(link, { signal });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status})`);
  }

  const length = Number(response.headers.get("content-length"));
  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  onProgress?.(length > 0 ? 0 : null);

  for (;;) {
    const result = await reader.read();
    if (result.done) return chunks;
    chunks.push(result.value);
    received += result.value.length;
    if (length > 0) onProgress?.(Math.min(1, received / length));
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

/** One song as a queue job: fetch it (the rings follow the bytes), then save it as `Artist - Title.m4a`. */
function downloadJob(song: Downloadable, quality: StreamQuality): DownloadJob {
  return {
    id: song.id,
    async run({ signal, progress }) {
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
      const blob = new Blob(await readAudio(link, signal, progress), {
        type: "audio/mp4",
      });
      const title = downloadTitle(song);
      const artists = downloadArtists(song);
      saveBlob(
        blob,
        `${safeName(artists ? `${artists} - ${title}` : title)}.m4a`,
      );
    },
  };
}

/** The rings are the progress; the one toast is the outcome. A single song that worked says nothing. */
function reportOutcome({ total, failed, cancelled }: DownloadSummary) {
  if (cancelled) return;
  if (failed === total) toast.error(FAILED_MESSAGE);
  else if (failed) toast.error(`Downloaded ${total - failed} of ${total} songs`);
  else if (total > 1) toast.success(`Downloaded ${total} songs`);
}

/**
 * Queues the songs, one file each, at the chosen quality. `isDownloading` is
 * true while any of them is queued or running; `batch` keys the progress
 * selectors and `cancel` drops what has not finished.
 */
export function useDownloadSongs(songs: Downloadable[]) {
  const [downloadQuality] = useDownloadQuality();
  const [batch, setBatch] = React.useState<number | null>(null);
  const isDownloading = useDownloads(
    (s) => batch !== null && s.batches.has(batch),
  );

  async function download() {
    const queued = enqueueDownloads(
      songs.map((song) => downloadJob(song, downloadQuality)),
    );
    if (!queued) return;
    setBatch(queued.batch);
    reportOutcome(await queued.done);
  }

  function cancel() {
    if (batch !== null) cancelBatch(batch);
  }

  return { batch, isDownloading, download, cancel };
}

export function DownloadButton({
  songs,
  className,
  ...rest
}: DownloadButtonProps) {
  const { batch, isDownloading, download, cancel } = useDownloadSongs(songs);
  const fraction = useBatchFraction(batch);
  const total = useBatchTotal(batch);
  const current = Math.min(useBatchDone(batch) + 1, total);

  // "Download 0 songs" is a dead control.
  if (songs.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        aria-label={
          isDownloading
            ? "Cancel download"
            : `Download ${songs.length} song${songs.length === 1 ? "" : "s"}`
        }
        onClick={isDownloading ? cancel : download}
        className={cn(
          controlStyles.rowIcon,
          "inline-flex items-center justify-center text-muted-foreground outline-hidden transition-colors duration-fast hover:bg-fill hover:text-foreground active:bg-fill-2 focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...rest}
      >
        <span className="relative size-4.5">
          <CloudDownload
            aria-hidden
            className={cn(
              "absolute inset-0 size-4.5 transition-[opacity,scale] duration-fast ease-out",
              isDownloading && "scale-80 opacity-0",
            )}
          />
          {isDownloading && (
            <DownloadRing
              // Nothing read yet (or no Content-Length): spin rather than sit at an empty ring.
              fraction={fraction > 0 ? fraction : null}
              label={`Downloading ${current} of ${total}`}
              className="absolute inset-0 size-4.5"
            />
          )}
        </span>
      </TooltipTrigger>

      <TooltipContent>
        {isDownloading
          ? "Cancel download"
          : songs.length === 1
            ? `Download \`${songs[0] ? downloadTitle(songs[0]) : ""}\``
            : `Download ${songs.length} songs`}
      </TooltipContent>
    </Tooltip>
  );
}
