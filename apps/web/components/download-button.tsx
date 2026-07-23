"use client";

import type { Episode, Song } from "@infinitunes/types";
import { QUALITIES_MAP } from "@infinitunes/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@infinitunes/ui/components/tooltip";
import { CloudDownload, Loader } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { useDownloadQuality } from "~/hooks/use-store";

type DownloadButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  songs: (Song | Episode)[];
};

export function DownloadButton({ songs, ...rest }: DownloadButtonProps) {
  const [downloadQuality] = useDownloadQuality();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadQualityIndex = QUALITIES_MAP.findIndex(
    ({ quality }) => quality === downloadQuality,
  );

  const downloadHandler = async () => {
    setIsDownloading(true);
    try {
      await Promise.all(
        songs.map(async (song) => {
          const name = "name" in song ? song.name : "";
          const download_url = "download_url" in song ? song.download_url : "";
          const link = Array.isArray(download_url)
            ? (download_url[downloadQualityIndex]?.link ??
              download_url[0]?.link)
            : download_url;
          if (!link) return;

          const response = await fetch(link as string);

          if (!response.body) return;

          const reader = response.body.getReader();

          const chunks: BlobPart[] = [];

          const contentLength = parseInt(
            response.headers.get("content-length") ?? "0",
            10,
          );

          let receivedLength = 0;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value!);
            receivedLength += value!.length;

            const progress = Math.floor((receivedLength / contentLength) * 100);

            if (progress === 100) {
              toast.success(`Downloaded ${name}`);
            }
          }

          const blob = new Blob(chunks, { type: "audio/mp4" });

          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = name + ".m4a";

          function handleDownload() {
            setTimeout(() => {
              URL.revokeObjectURL(url);
              a.removeEventListener("click", handleDownload, false);
            }, 150);
          }

          a.addEventListener("click", handleDownload, false);

          a.click();
        }),
      );
    } catch (error) {
      console.error;
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        aria-label={`Download ${songs.length} songs`}
        onClick={downloadHandler}
        {...rest}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader className="size-5 animate-spin" />
        ) : (
          <CloudDownload className="size-5" />
        )}
      </TooltipTrigger>

      <TooltipContent>
        {songs.length === 1
          ? `Download \`${"name" in songs[0] ? songs[0].name : ""}\``
          : `Download ${songs.length} songs`}
      </TooltipContent>
    </Tooltip>
  );
}
