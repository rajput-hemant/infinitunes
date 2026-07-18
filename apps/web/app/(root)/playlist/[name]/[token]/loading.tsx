import React from "react";

import {
  DetailsHeaderSkeleton,
  SongListSkeleton,
} from "@/components/skeletons";

export default function PlaylistDetailsSkeleton() {
  return (
    <div className="space-y-4">
      <DetailsHeaderSkeleton type="playlist" />
      <SongListSkeleton length={20} />
    </div>
  );
}
