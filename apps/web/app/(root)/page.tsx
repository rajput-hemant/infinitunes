import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";

import { SliderCard } from "~/components/slider";
import { siteConfig } from "~/config/site";
import { getHomeData } from "~/lib/jiosaavn-api";
import { cn } from "~/lib/utils";
import type { Type } from "~/types";

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
    if (
      key === "modules" ||
      key === "global_config" ||
      key === "browse_discover" ||
      !Array.isArray(section)
    )
      return null;

    const items = section as {
      id: string;
      title: string;
      perma_url: string;
      subtitle?: string;
      type: Type;
      image: string;
      explicit_content?: string;
    }[];

    return (
      <section key={key} className="mb-4 space-y-4">
        <header className="border-b pb-2">
          <h1 className="sr-only">{siteConfig.name} Homepage</h1>
        </header>

        <ScrollArea>
          <div
            className={cn("flex sm:gap-2 xl:pb-6", {
              "grid grid-flow-col grid-rows-2 place-content-start": [
                "trending",
                "new_albums",
                "charts",
              ].includes(key),
            })}
          >
            {items.map(
              ({
                id,
                title,
                perma_url,
                subtitle,
                type,
                image,
                explicit_content,
              }) => (
                <SliderCard
                  key={id}
                  title={title}
                  perma_url={perma_url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit_content}
                />
              ),
            )}
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    );
  });
}
