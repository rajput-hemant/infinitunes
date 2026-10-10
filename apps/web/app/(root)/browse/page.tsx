import { languages } from "~/config/languages";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";
import { asRoute, getHref } from "~/lib/utils";

import { BrowseTile } from "./_components/browse-tile";
import { CatalogHeader } from "./_components/catalog-header";
import { tileColor, tileGradient } from "./_components/tile-palette";

const title = `Browse Albums, Charts, Playlists and Podcasts on ${siteConfig.name}`;
const description = `Explore top albums, charts, playlists, podcasts, artists and radio stations by language on ${siteConfig.name}.`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/browse",
  alt: "Browse",
});

export default async function BrowsePage() {
  const [home, topAlbums, charts, playlists, shows, artists, stations] =
    await Promise.all([
      api.home.home({}),
      api.get.topAlbums({ page: 1, n: 1 }),
      api.get.charts({ page: 1, n: 1 }),
      api.get.featuredPlaylists({ page: 1, n: 1 }),
      api.get.topShows({ page: 1, n: 1 }),
      api.get.topArtists({ page: 1, n: 1 }),
      api.get.featuredStations({ page: 1, n: 1 }),
    ]);

  const mix = home.tag_mixes?.[0];

  const categories = [
    {
      label: "Top Albums",
      href: asRoute("/album"),
      image: topAlbums.data[0]?.image,
    },
    { label: "Top Charts", href: asRoute("/chart"), image: charts[0]?.image },
    {
      label: "Top Playlists",
      href: asRoute("/playlist"),
      image: playlists.data[0]?.image,
    },
    { label: "Podcasts", href: asRoute("/show"), image: shows.data[0]?.image },
    {
      label: "Top Artists",
      href: asRoute("/artist"),
      image: artists.top_artists[0]?.image,
    },
    { label: "Radio", href: asRoute("/radio"), image: stations[0]?.image },
    {
      label: "New Releases",
      href: asRoute("/album"),
      image: home.new_albums[0]?.image,
    },
    ...(mix
      ? [
          {
            label: "Made for you",
            href: getHref(mix.perma_url, "mix"),
            image: mix.image,
          },
        ]
      : []),
  ];

  return (
    <div>
      <CatalogHeader
        title="Browse"
        subtitle="Explore by category, language or mood."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
        {categories.map((category, k) => (
          <BrowseTile
            key={category.label}
            href={category.href}
            title={category.label}
            image={category.image}
            background={tileColor(k)}
          />
        ))}
      </div>

      <section className="mt-8 space-y-3">
        <h2 className="font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
          Languages
        </h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
          {languages.map((language, k) => (
            <BrowseTile
              key={language}
              href={asRoute(`/album?lang=${language.toLowerCase()}`)}
              title={language}
              background={tileGradient(k)}
              className="h-18"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
