import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";

import { SliderCard } from "~/components/slider/slider-card";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
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

type TopPodcastsPageProps = { searchParams: Promise<{ page?: number }> };

export default async function TopPodcastsPage(props: TopPodcastsPageProps) {
  const { page = 1 } = await props.searchParams;

  const topShows = await api.get.topShows({ page, n: 50 });

  const trendingGroup = topShows.trendingPodcasts?.[0];
  const trendingPodcasts = trendingGroup?.items ?? [];
  const trendingTitle = trendingGroup?.module.title ?? "Trending Podcasts";
  const trendingSubtitle = trendingGroup?.module.subtitle ?? "";

  return (
    <div className="space-y-4">
      <header className="mt-4">
        <h1 className="font-heading text-2xl capitalize dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
          {trendingTitle}
        </h1>

        <p className="pl-1 font-medium text-muted-foreground">
          {trendingSubtitle}
        </p>
      </header>

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 pb-6">
          {trendingPodcasts.map(
            ({
              id,
              title: podcastTitle,
              perma_url,
              subtitle,
              type,
              image,
              explicit_content,
            }) => {
              return (
                <SliderCard
                  key={id}
                  name={podcastTitle}
                  url={perma_url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit_content}
                  hidePlayButton
                />
              );
            },
          )}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <h2 className="font-heading text-2xl capitalize dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        All Podcasts
      </h2>

      <TopPodcasts initialTopShows={topShows} />
    </div>
  );
}
