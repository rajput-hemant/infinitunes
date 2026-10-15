import type { Lang } from "@infinitunes/types";

import { CatalogHeader } from "~/app/(root)/browse/_components/catalog-header";
import { CatalogGridSkeleton } from "~/app/(root)/browse/_components/catalog-skeleton";
import { LanguageBar } from "~/components/language-bar";
import { KeyedByParams } from "~/components/search-params-boundary";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { parsePageParam } from "~/lib/page-param";
import { api } from "~/lib/trpc/server";

import { AlbumsSubtitle } from "./_components/albums-subtitle";
import { TopAlbums } from "./_components/top-albums";

const title = `Listen to New Hindi Songs Online Only on ${siteConfig.name}.`;
const description = `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}.`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/album",
  alt: "Top Albums",
});

type AlbumsPageProps = {
  searchParams: Promise<{ page?: string | string[]; lang?: Lang }>;
};

async function AlbumsGrid({ searchParams }: AlbumsPageProps) {
  const { page, lang } = await searchParams;

  const topAlbums = await api.get.topAlbums({
    page: parsePageParam(page),
    n: 50,
    lang,
  });

  return (
    <TopAlbums
      key={`${lang ?? "all"}-${topAlbums.data[0]?.id ?? "albums"}`}
      initialAlbums={topAlbums}
      lang={lang}
    />
  );
}

/**
 * The language chips and the heading prerender with the page; only the grid
 * waits on the query string and the catalog, and shows its skeleton again when
 * a different language is picked.
 */
export default function AlbumsPage({ searchParams }: AlbumsPageProps) {
  return (
    <div>
      <LanguageBar />

      <CatalogHeader title="Top Albums" subtitle={<AlbumsSubtitle />} />

      <KeyedByParams
        params={["lang", "page"]}
        fallback={
          <div className="min-h-svh">
            <CatalogGridSkeleton />
          </div>
        }
      >
        <AlbumsGrid searchParams={searchParams} />
      </KeyedByParams>
    </div>
  );
}
