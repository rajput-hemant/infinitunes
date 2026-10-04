import type { MediaType } from "@infinitunes/types";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";

import { SliderCard } from "~/components/slider/slider-card";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";
import { cn } from "~/lib/utils";

const title = `Online Songs on ${siteConfig.name}: Download & Play Latest Music for Free`;

const description = `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/",
  image: "https://graph.org/file/16937ebb693470d804f31.png",
  alt: `${siteConfig.name} Homepage`,
});

/** Sections that are not card lists. */
const SKIPPED_SECTIONS = new Set([
  "modules",
  "global_config",
  "browse_discover",
]);

/** Sections laid out as a two-row horizontal grid. */
const GRID_SECTIONS = new Set(["trending", "new_albums", "charts"]);

/** Fallback card type for sections whose items carry no `type`. */
const SECTION_TYPE: Record<string, MediaType> = {
  new_albums: "album",
  charts: "playlist",
  top_playlists: "playlist",
  radio: "radio_station",
};

type HomeItem = {
  id: string;
  title: string;
  perma_url: string;
  subtitle?: string;
  type: MediaType;
  image: string;
  explicit_content?: string | boolean;
};

export default async function HomePage() {
  const homedata = await api.home.home({});

  return (
    <>
      <h1 className="sr-only">{siteConfig.name} Homepage</h1>

      {Object.entries(homedata).map(([key, section]) => {
        if (SKIPPED_SECTIONS.has(key) || !Array.isArray(section)) return null;

        const items = section as HomeItem[];

        return (
          <section key={key} className="mb-4 space-y-4">
            <div className="border-b pb-2" aria-hidden="true" />

            <ScrollArea>
              <div
                className={cn("flex sm:gap-2 xl:pb-6", {
                  "grid grid-flow-col grid-rows-2 place-content-start":
                    GRID_SECTIONS.has(key),
                })}
              >
                {items.map(
                  ({
                    id,
                    title: itemTitle,
                    perma_url,
                    subtitle,
                    type: itemType,
                    image,
                    explicit_content,
                  }) => {
                    const effectiveType =
                      itemType || SECTION_TYPE[key] || "playlist";

                    return (
                      <SliderCard
                        key={id || itemTitle}
                        name={itemTitle}
                        url={perma_url}
                        subtitle={subtitle}
                        type={effectiveType}
                        image={image}
                        explicit={explicit_content}
                      />
                    );
                  },
                )}
              </div>

              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        );
      })}
    </>
  );
}
