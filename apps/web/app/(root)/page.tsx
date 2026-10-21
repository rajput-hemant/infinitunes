import {
  decode,
  getImageSrc,
  homeHighlights,
  homeSections,
  parseToken,
} from "@infinitunes/types";

import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";
import { SliderCard } from "~/components/slider/slider-card";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";
import { getHref } from "~/lib/utils";

import { HomeHeader } from "./_components/home-header";
import { HomeHero } from "./_components/home-hero";
import type { HeroTile } from "./_components/home-hero";
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

/** Sections laid out as a two-row horizontal grid. */
const GRID_SECTIONS = new Set(["trending", "new_albums", "charts"]);

export default async function HomePage() {
  const homedata = await api.home.home({});
  const highlights = homeHighlights(homedata);

  const { featured } = highlights;
  const quickPicks: QuickPickItem[] = highlights.quickPicks.map((item) => ({
    key: `${item.type}-${item.id}`,
    href: getHref(item.perma_url, item.type),
    title: decode(item.title),
    image: getImageSrc(item.image, "high"),
    type: item.type,
    token: parseToken(item.perma_url),
  }));

  const heroTiles: HeroTile[] = highlights.heroTiles.map((item) => ({
    key: `${item.type}-${item.id}`,
    href: getHref(item.perma_url, item.type),
    title: decode(item.title),
    image: item.image,
    type: item.type,
    token: parseToken(item.perma_url),
  }));

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <HomeHeader />

      {(featured || quickPicks.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {featured && <HomeHero playlist={featured} tiles={heroTiles} />}

          {quickPicks.length > 0 && <QuickPicks items={quickPicks} />}
        </div>
      )}

      {homeSections(homedata).map(({ key, title: sectionTitle, items }) => (
        <section key={key}>
          <Shelf
            rows={GRID_SECTIONS.has(key) ? 2 : 1}
            heading={
              sectionTitle && (
                <h2 className="font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
                  {decode(sectionTitle)}
                </h2>
              )
            }
          >
            {items.map((item) => (
              <ShelfItem key={item.id || item.title}>
                <SliderCard
                  name={item.title}
                  url={item.perma_url}
                  subtitle={item.subtitle}
                  type={item.type}
                  image={item.image}
                  explicit={item.explicit_content}
                />
              </ShelfItem>
            ))}
          </Shelf>
        </section>
      ))}
    </div>
  );
}
