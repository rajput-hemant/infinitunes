import { uniqueBy } from "@infinitunes/types";
import { Music } from "lucide-react";
import { Suspense } from "react";

import { CatalogGrid } from "~/app/(root)/browse/_components/catalog-grid";
import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import {
  CatalogEmpty,
  CatalogEnd,
} from "~/app/(root)/browse/_components/catalog-states";
import { FIRST_ROW_CARDS, SliderCard } from "~/components/slider/slider-card";
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
async function Charts() {
  const charts = await api.get.charts({ page: 1, n: 50 });

  return charts.length === 0 ? (
    <CatalogEmpty
      icon={Music}
      title="No charts yet"
      description="Charts are updated regularly. Check back soon."
    />
  ) : (
    <>
      <CatalogGrid>
        {uniqueBy(charts, (chart) => chart.id).map(
          (
            {
              id,
              title: chartTitle,
              perma_url,
              subtitle,
              type,
              image,
              explicit_content,
            },
            index,
          ) => (
            <SliderCard
              priority={index < FIRST_ROW_CARDS}
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
  );
}

export default function ChartsPage() {
  return (
    <div>
      <CatalogHeader title="Top Charts" subtitle="Updated every Friday." />

      <Suspense fallback={<CatalogGridSkeleton aspect="video" />}>
        <Charts />
      </Suspense>
    </div>
  );
}
