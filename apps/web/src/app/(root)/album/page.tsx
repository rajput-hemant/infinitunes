import type { Lang } from "@/types";

import { LanguageBar } from "@/components/language-bar";
import { siteConfig } from "@/config/site";
import { getTopAlbums } from "@/lib/jiosaavn-api";
import { TopAlbums } from "./_components/top-albums";

const title = `Listen to New Hindi Songs Online Only on ${siteConfig.name}.`;
const description = `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}.`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,

    url: "/album",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/40972e692b4439ec36c6f.png`,
      alt: "Top Albums",
    },
  },
};

type AlbumsPageProps = {
  searchParams: Promise<{ page?: number; lang?: Lang }>;
};

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const { page = 1, lang } = await searchParams;

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
