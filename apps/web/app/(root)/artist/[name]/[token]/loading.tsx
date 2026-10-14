"use client";

import { usePathname } from "next/navigation";

import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";

import { ArtistBodySkeleton } from "./_components/artist-skeleton";

/**
 * Mirrors the artist page: header, tab row, the tab the URL slug selects
 * (`-songs`, `-albums`, else Overview), then the shelves. Client-side only to
 * read that slug.
 */
export default function ArtistDetailsLoading() {
  const name = usePathname().split("/")[2] ?? "";
  const tab = name.endsWith("-songs")
    ? "songs"
    : name.endsWith("-albums")
      ? "albums"
      : "overview";

  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="artist" />

      <ArtistBodySkeleton tab={tab} />
    </div>
  );
}
