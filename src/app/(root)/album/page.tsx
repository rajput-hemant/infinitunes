import type { Lang } from "@/types";

import { LanguageBar } from "@/components/language-bar";
import { siteConfig } from "@/config/site";
import { getTopAlbums } from "@/lib/jiosaavn-api";
import { TopAlbums } from "./_components/top-albums";

export const metadata = {
  title: `Listen to New Hindi Songs Online Only on ${siteConfig.name}.`,
  description: `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}.`,
};

type AlbumsPageProps = {
  searchParams: { page?: number; lang?: Lang };
};

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const { page = 1, lang } = searchParams;

  const topAlbums = await getTopAlbums(page, 50, lang);

  return (
    <div className="space-y-4">
      <LanguageBar language={lang} />

      <h1 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
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
