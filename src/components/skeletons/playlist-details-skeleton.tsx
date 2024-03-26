import React from "react";

import { DetailsHeaderSkeleton } from "./details-header-skeleton";
import { SongListSkeleton } from "./song-list-skeleton";

export function PlaylistDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="playlist" />
      <SongListSkeleton length={20} />
    </div>
  );
}
