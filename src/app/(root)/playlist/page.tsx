import type { Lang } from "@/types";

import { LanguageBar } from "@/components/language-bar";
import { getFeaturedPlaylists } from "@/lib/jiosaavn-api";
import { FeaturedPlaylists } from "./_components/featured-playlists";

type PageProps = { searchParams: { page?: number; lang?: Lang } };

export default async function PlaylistsPage({ searchParams }: PageProps) {
  const { page = 1, lang } = searchParams;

  const featuredPlaylists = await getFeaturedPlaylists(page, 50, lang);

  return (
    <div className="space-y-4">
      <LanguageBar language={lang} />

      <h1 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        {lang ? `${lang} Music` : "Top"} Playlists
      </h1>

      <FeaturedPlaylists
        key={featuredPlaylists.data[0].id}
        initialPlaylists={featuredPlaylists}
        lang={lang}
      />
    </div>
  );
}
