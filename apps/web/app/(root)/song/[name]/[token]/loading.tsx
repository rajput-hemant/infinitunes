import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import { PageSectionTitleSkeleton } from "~/components/page-section-skeleton";
import { SliderListSkeleton } from "~/components/slider/shelf-skeleton";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

/** Mirrors the song page: header, more from the album, recommendation shelves, artists. */
export default function SongDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="song" />

      <section className="flex flex-col gap-4">
        <PageSectionTitleSkeleton />

        <SongListSkeleton length={5} />
      </section>

      <SliderListSkeleton sections={3} />

      <SliderListSkeleton rounded hideSubtitle />
    </div>
  );
}
