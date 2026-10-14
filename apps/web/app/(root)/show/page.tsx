import { Skeleton } from "@infinitunes/ui/components/skeleton";

import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { KeyedByParams } from "~/components/search-params-boundary";
import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";
import { ShelfSkeleton } from "~/components/slider/shelf-skeleton";
import { SliderCard } from "~/components/slider/slider-card";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { parsePageParam } from "~/lib/page-param";
import { api } from "~/lib/trpc/server";

import { TopPodcasts } from "./_components/top-podcasts";

const title = `Latest podcasts - download and listen online @${siteConfig.name}`;
const description = `Listen to the latest podcasts online on ${siteConfig.name}. Download and listen to new, exclusive, electronic dance music and house tracks.`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/show",
  alt: "Original Podcasts",
});

type TopPodcastsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function PodcastsSkeleton() {
  return (
    <>
      <Skeleton className="mb-3 h-7 w-52" />

      <ShelfSkeleton rows={2} count={8} hideSubtitle />

      <Skeleton className="mt-8 mb-3 h-7 w-40" />

      <CatalogGridSkeleton hideSubtitle />
    </>
  );
}

async function Podcasts({ searchParams }: TopPodcastsPageProps) {
  const { page } = await searchParams;

  const topShows = await api.get.topShows({
    page: parsePageParam(page),
    n: 50,
  });

  const trendingGroup = topShows.trendingPodcasts?.[0];
  const trendingPodcasts = trendingGroup?.items ?? [];
  const trendingTitle = trendingGroup?.module.title ?? "Trending Podcasts";

  return (
    <>
      <h2 className="mb-3 text-xl leading-7 font-bold tracking-[-0.015em]">
        {trendingTitle}
      </h2>

      <Shelf rows={2}>
        {trendingPodcasts.map(
          ({
            id,
            title: podcastTitle,
            perma_url,
            subtitle,
            type,
            image,
            explicit_content,
          }) => (
            <ShelfItem key={id}>
              <SliderCard
                name={podcastTitle}
                url={perma_url}
                subtitle={subtitle}
                type={type}
                image={image}
                explicit={explicit_content}
                hidePlayButton
              />
            </ShelfItem>
          ),
        )}
      </Shelf>

      <h2 className="mt-8 mb-3 text-xl leading-7 font-bold tracking-[-0.015em]">
        All Podcasts
      </h2>

      <TopPodcasts initialTopShows={topShows} />
    </>
  );
}

export default function TopPodcastsPage({
  searchParams,
}: TopPodcastsPageProps) {
  return (
    <div>
      <CatalogHeader title="Podcasts" subtitle="Top shows across languages." />

      <KeyedByParams params={["page"]} fallback={<PodcastsSkeleton />}>
        <Podcasts searchParams={searchParams} />
      </KeyedByParams>
    </div>
  );
}
