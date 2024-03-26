import React from "react";

import { DetailsHeaderSkeleton } from "./details-header-skeleton";
import { SliderListSkeleton } from "./slider-list-skeleton";
import { SongListSkeleton } from "./song-list-skeleton";

export function AlbumDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="album" />

      <SongListSkeleton showAlbum={false} />

      <SliderListSkeleton />
    </div>
  );
}
