import { Clock } from "lucide-react";

import { cn } from "~/lib/utils";

import {
  albumCellVisibility,
  artistCellVisibility,
  songRowGrid,
} from "./row-grid";

/** Compact density column labels; the comfortable list has no table head. */
export function SongListHead({ showAlbum }: { showAlbum: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        songRowGrid,
        "mb-1 hidden h-8 border-b border-border px-2 text-[0.6875rem] leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase [[data-density=compact]_&]:md:grid [&>span]:min-w-0 [&>span]:truncate",
      )}
    >
      <span className="text-center">#</span>
      <span>Title</span>
      <span className={artistCellVisibility}>Artist</span>
      <span className={albumCellVisibility}>{showAlbum && "Album"}</span>
      <span className="flex justify-end">
        <Clock className="size-4" />
      </span>
      <span />
    </div>
  );
}
