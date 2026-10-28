"use client";

import { DownloadRing } from "~/components/download-ring";
import {
  useDownloadProgress,
  useDownloadStatus,
} from "~/lib/download-store";

/** A row's download state: a ring while its song downloads, a dim dot while it waits, nothing otherwise. */
export function RowDownload({ id, name }: { id: string; name: string }) {
  const status = useDownloadStatus(id);
  const progress = useDownloadProgress(id);

  if (status === "idle") return null;

  return (
    <span className="grid size-6 shrink-0 place-items-center">
      {status === "active" ? (
        <DownloadRing fraction={progress} label={`Downloading ${name}`} />
      ) : (
        <span
          role="img"
          aria-label={`${name} is waiting to download`}
          className="size-1.5 rounded-full bg-primary opacity-40"
        />
      )}
    </span>
  );
}
