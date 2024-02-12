import { ItemCard } from "@/components/item-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { H2, Muted } from "@/components/ui/topography";
import { getTopShows } from "@/lib/jiosaavn-api";
import TopPodcasts from "./top-podcasts";

export const revalidate = 3600; // revalidate page every hour

type Props = { searchParams: { page?: number } };

const PodcastsPage = async ({ searchParams: { page = 1 } }: Props) => {
  const topShows = await getTopShows(page);
  const {
    trending_podcasts: { data: trendingPodcasts, title, subtitle },
  } = topShows;

  return (
    <div className="mb-4 space-y-4">
      <header className="mt-4">
        <H2 className="pb-0">{title}</H2>

        <Muted className="ml-1">{subtitle}</Muted>
      </header>

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 pb-6">
          {trendingPodcasts.map(
            ({ id, name, url, subtitle, type, image, explicit }) => {
              return (
                <ItemCard
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

      <H2>All Podcasts</H2>
      <TopPodcasts initialTopShows={topShows} />
    </div>
  );
};

export default PodcastsPage;
