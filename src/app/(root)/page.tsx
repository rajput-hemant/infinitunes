import { SliderCard } from "@/components/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { siteConfig } from "@/config/site";
import { getHomeData } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";

const title = `Online Songs on ${siteConfig.name}: Download & Play Latest Music for Free`;

const description = `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,

    url: "/",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/16937ebb693470d804f31.png`,
      alt: `${siteConfig.name} Homepage`,
    },
  },
};

export default async function HomePage() {
  const homedata = await getHomeData();

  return Object.entries(homedata).map(([key, section]) => {
    if ("random_songs_listid" in section || key === "discover") return null;

    return (
      <div key={key} className="mb-4 space-y-4">
        <header className="border-b pb-2">
          <h1 className="sr-only">{siteConfig.name} Homepage</h1>

          <h2 className="pl-2 font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl lg:pl-0">
            {section.title}
          </h2>

          {section.subtitle && (
            <p className="pl-2 font-medium text-muted-foreground lg:pl-0">
              {section.subtitle}
            </p>
          )}
        </header>

        <ScrollArea>
          <div
            className={cn("flex sm:gap-2 xl:pb-6", {
              "grid grid-flow-col grid-rows-2 place-content-start": [
                "trending",
                "albums",
                "charts",
              ].includes(key),
            })}
          >
            {section.data.map(
              ({ id, name, url, subtitle, type, image, explicit }) => (
                <SliderCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit}
                />
              )
            )}
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  });
}
