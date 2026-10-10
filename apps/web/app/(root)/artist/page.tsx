import { formatCount } from "@infinitunes/types";
import { Users } from "lucide-react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
import {
  CatalogEmpty,
  CatalogEnd,
} from "~/app/(root)/browse/_components/catalog-states";
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
  const artists = topArtists?.top_artists ?? [];

  return (
    <div>
      <CatalogHeader title="Top Artists" />

      {artists.length === 0 ? (
        <CatalogEmpty
          icon={Users}
          title="No artists yet"
          description="Check back later for the top artists."
        />
      ) : (
        <>
          <CatalogGrid>
            {artists.map(
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
          </CatalogGrid>

          <CatalogEnd />
        </>
      )}
    </div>
  );
}
