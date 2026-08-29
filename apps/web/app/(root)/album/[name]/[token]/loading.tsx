import React from "react";

import { DetailsHeaderSkeleton } from "~/components/skeletons/details-header-skeleton";
import { SliderListSkeleton } from "~/components/skeletons/slider-list-skeleton";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";

export default function AlbumDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="album" />

      <SongListSkeleton showAlbum={false} />

      <SliderListSkeleton />
    </div>
  );
}
