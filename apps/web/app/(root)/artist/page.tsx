import { formatCount } from "@infinitunes/types";

import { SliderCard } from "~/components/slider/slider-card";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

const title = ` Top Indian Music Artists - Download or Listen Free on ${siteConfig.name} `;
const description = `Search for songs based on Top Artist. Get new and old songs based on artists along with details of individual artist on ${siteConfig.name}.`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/artist",
  alt: "Top Indian Music Artists",
});

export default async function TopArtistsPage() {
  const topArtists = await api.get.topArtists({ page: 1, n: 50 });

  return (
    <div className="my-4 space-y-4">
      <h1 className="font-heading text-2xl drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        Top Artists
      </h1>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {topArtists?.top_artists?.map(
          ({ artistid, name, perma_url, follower_count, image }) => (
            <SliderCard
              key={artistid}
              name={name}
              url={perma_url}
              subtitle={`${formatCount(follower_count)} Fans`}
              type="artist"
              image={image}
            />
          ),
        )}
      </div>

      <h2 className="py-6 text-center font-heading text-xl drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
        <em>Yay! You have seen it all</em>{" "}
        <span className="text-foreground">🤩</span>
      </h2>
    </div>
  );
}
