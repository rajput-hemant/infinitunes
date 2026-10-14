import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import {
  PageSectionTitleSkeleton,
  TextLinesSkeleton,
} from "~/components/page-section-skeleton";
import { ShelfSkeleton } from "~/components/slider/shelf-skeleton";

import { EpisodesSkeleton } from "./_components/episodes-skeleton";

/** Mirrors the show page: header, about, season shelf, then the episode list. */
export default function ShowDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="show" />

      <section className="flex flex-col gap-4">
        <PageSectionTitleSkeleton />

        <TextLinesSkeleton lines={6} className="max-w-2xl" />
      </section>

      <PageSectionTitleSkeleton />

      <ShelfSkeleton aspect="video" hideSubtitle={false} count={5} />

      <EpisodesSkeleton />
    </div>
  );
}
