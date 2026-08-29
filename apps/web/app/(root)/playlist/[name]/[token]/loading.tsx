import React from "react";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function PlaylistDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="playlist" />
      <SongListSkeleton length={20} />
    </div>
  );
}
