import React from "react";

import {
  DetailsHeaderSkeleton,
  SliderListSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";

export default function AlbumDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="album" />

      <SongListSkeleton showAlbum={false} />

      <SliderListSkeleton />
    </div>
  );
}
