import type { Lang } from "@infinitunes/types";

import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { KeyedByParams } from "~/components/search-params-boundary";
import { pageMetadata } from "~/lib/metadata";
import { parsePageParam } from "~/lib/page-param";
import { api } from "~/lib/trpc/server";

import { FeaturedStations } from "./_components/featured-stations";

const title = "Top Indian Radio Stations";
const description =
  "Listen to the top Indian radio stations online. Stream live music, news, sports, and talk radio from India.";

export const metadata = pageMetadata({
  title,
  description,
  url: "/radio",
  alt: "Top Indian Radio Stations",
});

type RadioPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    lang?: Lang;
  }>;
};

async function StationsGrid({ searchParams }: RadioPageProps) {
  const { page, lang } = await searchParams;

  const radioStations = await api.get.featuredStations({
    page: parsePageParam(page),
    n: 50,
    lang,
  });

  return (
    <FeaturedStations
      key={`${lang ?? "all"}-${radioStations[0]?.id ?? "stations"}`}
      initialStations={radioStations}
      lang={lang}
    />
  );
}

export default function RadioPage({ searchParams }: RadioPageProps) {
  return (
    <div>
      <CatalogHeader
        title="Radio"
        subtitle="Endless stations for every mood."
      />

      <KeyedByParams
        params={["lang", "page"]}
        fallback={
          <div className="min-h-svh">
            <CatalogGridSkeleton rounded />
          </div>
        }
      >
        <StationsGrid searchParams={searchParams} />
      </KeyedByParams>
    </div>
  );
}
