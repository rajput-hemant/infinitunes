import { detailPanelClassName } from "~/components/details-header/details-header-band";
import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";
import {
  PageSectionTitleSkeleton,
  TextLinesSkeleton,
} from "~/components/page-section-skeleton";

/** Mirrors the episode page: header, then the description card. */
export default function EpisodeDetailsLoading() {
  return (
    <div className="flex flex-col gap-(--page-gap)" aria-busy="true">
      <DetailsHeaderSkeleton type="episode" />

      <section className={detailPanelClassName}>
        <PageSectionTitleSkeleton className="ml-0" />

        <TextLinesSkeleton lines={5} />
      </section>
    </div>
  );
}
