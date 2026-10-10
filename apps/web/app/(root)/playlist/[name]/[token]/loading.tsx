import React from "react";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function PlaylistDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeaderSkeleton type="playlist" />
      <SongListSkeleton length={20} />
    </div>
  );
}
