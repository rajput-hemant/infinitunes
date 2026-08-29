import type { TopShows } from "@infinitunes/types";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";

import { SliderCard } from "~/components/slider";
import { api } from "~/lib/trpc/server";

import { TopPodcasts } from "./_components/top-podcasts";

const title = `Latest podcasts - download and listen online @JioSaavn`;
const description = `Listen to the latest podcasts online on JioSaavn. Download and listen to new, exclusive, electronic dance music and house tracks.`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/show",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/d19f3d8420f985480bf5b.png`,
      alt: "Original Podcasts",
    },
  },
};

type TopPodcastsPageProps = { searchParams: Promise<{ page?: number }> };

export default async function TopPodcastsPage(props: TopPodcastsPageProps) {
  const { page = 1 } = await props.searchParams;

  const topShows = (await api.get.topShows({
    page,
    n: 50,
  })) as unknown as TopShows;

  const trendingGroup = topShows.trendingPodcasts?.[0];
  const trendingPodcasts = trendingGroup?.items ?? [];
  const trendingTitle = trendingGroup?.module.title ?? "Trending Podcasts";
  const trendingSubtitle = trendingGroup?.module.subtitle ?? "";

  return (
    <div className="space-y-4">
      <header className="mt-4">
        <h1 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
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

      <h2 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        All Podcasts
      </h2>

      <TopPodcasts initialTopShows={topShows} />
    </div>
  );
}
