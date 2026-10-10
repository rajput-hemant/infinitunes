import type { MediaType } from "@infinitunes/types";
import { decode, getImageSrc } from "@infinitunes/types";

import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";
import { SliderCard } from "~/components/slider/slider-card";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";
import { getHref } from "~/lib/utils";

import { HomeHero } from "./_components/home-hero";
import { QuickPicks } from "./_components/quick-picks";
import type { QuickPickItem } from "./_components/quick-picks";

const title = `Online Songs on ${siteConfig.name}: Download & Play Latest Music for Free`;

const description = `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/",
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

const QUICK_PICK_ALBUMS = 4;
const QUICK_PICK_PLAYLISTS = 4;

export default async function HomePage() {
  const homedata = await api.home.home({});

  const featured = homedata.top_playlists[0];
  const quickPicks: QuickPickItem[] = [
    ...homedata.new_albums.slice(0, QUICK_PICK_ALBUMS),
    ...homedata.top_playlists.slice(1, 1 + QUICK_PICK_PLAYLISTS),
  ].map((item) => ({
    key: `${item.type}-${item.id}`,
    href: getHref(item.perma_url, item.type),
    title: decode(item.title),
    image: getImageSrc(item.image, "high"),
  }));

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <h1 className="sr-only">{siteConfig.name} Homepage</h1>

      {(featured || quickPicks.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {featured && <HomeHero playlist={featured} />}

          {quickPicks.length > 0 && <QuickPicks items={quickPicks} />}
        </div>
      )}

      {Object.entries(homedata).map(([key, section]) => {
        if (SKIPPED_SECTIONS.has(key) || !Array.isArray(section)) return null;

        const items = section as HomeItem[];
        const sectionTitle = homedata.modules?.[key]?.title;

        return (
          <section key={key} className="space-y-3">
            {sectionTitle && (
              <h2 className="font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
                {decode(sectionTitle)}
              </h2>
            )}

            <Shelf rows={GRID_SECTIONS.has(key) ? 2 : 1}>
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
                    <ShelfItem key={id || itemTitle}>
                      <SliderCard
                        name={itemTitle}
                        url={perma_url}
                        subtitle={subtitle}
                        type={effectiveType}
                        image={image}
                        explicit={explicit_content}
                      />
                    </ShelfItem>
                  );
                },
              )}
            </Shelf>
          </section>
        );
      })}
    </div>
  );
}
