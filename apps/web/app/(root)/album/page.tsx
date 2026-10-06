import type { Lang } from "@infinitunes/types";

import { LanguageBar } from "~/components/language-bar";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

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
  searchParams: Promise<{ page?: number; lang?: Lang }>;
};

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const { page = 1, lang } = await searchParams;

  const topAlbums = await api.get.topAlbums({ page, n: 50, lang });

  return (
    <div className="space-y-4">
      <LanguageBar language={lang} />

      <h1 className="font-heading text-2xl capitalize dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        {`New ${lang ?? ""} Songs`}
      </h1>

      <TopAlbums
        key={topAlbums.data[0].id}
        initialAlbums={topAlbums}
        lang={lang}
      />
    </div>
  );
}
