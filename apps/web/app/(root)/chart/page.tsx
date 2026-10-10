import { Music } from "lucide-react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
import {
  CatalogEmpty,
  CatalogEnd,
} from "~/app/(root)/browse/_components/catalog-states";
import { SliderCard } from "~/components/slider/slider-card";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

const title = "Top Music Charts";
const description = "Listen to the top music charts from around the world.";

export const metadata = pageMetadata({
  title,
  description,
  url: "/chart",
  alt: "Top Music Charts",
});
// TODO: Cache Components adoption. Defer navigation validation until the shared session and navigation shell streams independently.
export const instant = false;

export default async function ChartsPage() {
  const charts = await api.get.charts({ page: 1, n: 50 });

  return (
    <div>
      <CatalogHeader title="Top Music Charts" />

      {charts.length === 0 ? (
        <CatalogEmpty
          icon={Music}
          title="No charts yet"
          description="Charts are updated regularly. Check back soon."
        />
      ) : (
        <>
          <CatalogGrid>
            {charts.map(
              ({
                id,
                title: chartTitle,
                perma_url,
                subtitle,
                type,
                image,
                explicit_content,
              }) => (
                <SliderCard
                  key={id}
                  name={chartTitle}
                  url={perma_url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit_content}
                  aspect="video"
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
