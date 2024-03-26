import { SliderCard } from "@/components/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getTopShows } from "@/lib/jiosaavn-api";
import { TopPodcasts } from "./_components/top-podcasts";

type TopPodcastsPageProps = { searchParams: { page?: number } };

export default async function TopPodcastsPage(props: TopPodcastsPageProps) {
  const topShows = await getTopShows(props.searchParams.page ?? 1);

  const {
    trending_podcasts: { data: trendingPodcasts, title, subtitle },
  } = topShows;

  return (
    <div className="space-y-4">
      <header className="mt-4">
        <h1 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
          {title}
        </h1>

        <p className="pl-1 font-medium text-muted-foreground">{subtitle}</p>
      </header>

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 pb-6">
          {trendingPodcasts.map(
            ({ id, name, url, subtitle, type, image, explicit }) => {
              return (
                <SliderCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit}
                />
              );
            }
          )}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <h2 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        All Podcasts
      </h2>

      <TopPodcasts initialTopShows={topShows} />
    </div>
  );
}
