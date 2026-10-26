import type { Lang } from "@infinitunes/types";

import { CatalogHeader } from "~/components/catalog/catalog-header";
import { CatalogGridSkeleton } from "~/components/catalog/catalog-skeleton";
import { KeyedByParams } from "~/components/search-params-boundary";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { parsePageParam } from "~/lib/page-param";
import { api } from "~/lib/trpc/server";

import { FeaturedPlaylists } from "./_components/featured-playlists";
import { PlaylistsTitle } from "./_components/playlists-title";

const title = `Best Songs - Online Downloads and Playlists @${siteConfig.name}`;
const description = `The music buffs at ${siteConfig.name} have created music playlists which include a huge variety of songs from various genres such as festivals, devotional, film, wedding, dance & more.`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/playlist",
  alt: "Top Featured Playlists",
});
type PageProps = {
  searchParams: Promise<{ page?: string | string[]; lang?: Lang }>;
};

async function PlaylistsGrid({ searchParams }: PageProps) {
  const { page, lang } = await searchParams;

  const pageNumber = parsePageParam(page);

  const featuredPlaylists = await api.get.featuredPlaylists({
    page: pageNumber,
    n: 50,
    lang,
  });

  return (
    <FeaturedPlaylists
      key={`${lang ?? "all"}-${featuredPlaylists.data[0]?.id ?? "playlists"}`}
      initialPlaylists={featuredPlaylists}
      page={pageNumber}
      lang={lang}
    />
  );
}

export default function PlaylistsPage({ searchParams }: PageProps) {
  return (
    <div>
      <CatalogHeader title={<PlaylistsTitle />} />

      <KeyedByParams
        params={["lang", "page"]}
        fallback={
          <div className="min-h-svh">
            <CatalogGridSkeleton />
          </div>
        }
      >
        <PlaylistsGrid searchParams={searchParams} />
      </KeyedByParams>
    </div>
  );
}
