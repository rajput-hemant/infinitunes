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
import { cn } from "~/lib/utils";

type DownloadButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  songs: (Song | Episode)[];
};

export function DownloadButton({
  songs,
  className,
  ...rest
}: DownloadButtonProps) {
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
          const name = song.title;
          const links = (song.download_url ?? song.more_info.download_url ?? "")
            .split(",")
            .filter(Boolean);
          const link = links[downloadQualityIndex] ?? links[0];
          if (!link) return;

          const response = await fetch(link);

          if (!response.body) return;

          const reader = response.body.getReader();

          const chunks: BlobPart[] = [];

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value!);
          }

          toast.success(`Downloaded ${name}`);

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
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        aria-label={`Download ${songs.length} song${songs.length === 1 ? "" : "s"}`}
        onClick={downloadHandler}
        className={cn(
          "inline-flex items-center justify-center rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...rest}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <CloudDownload aria-hidden="true" className="size-5" />
        )}
      </TooltipTrigger>

      <TooltipContent>
        {songs.length === 1
          ? `Download \`${songs[0]?.title ?? ""}\``
          : `Download ${songs.length} songs`}
      </TooltipContent>
    </Tooltip>
  );
}
