import type { Lang } from "@/types";

import { LanguageBar } from "@/components/language-bar";
import { siteConfig } from "@/config/site";
import { getFeaturedPlaylists } from "@/lib/jiosaavn-api";
import { FeaturedPlaylists } from "./_components/featured-playlists";

const title = ` Best Songs ${new Date().getFullYear()} - Online Downloads and Playlists @${siteConfig.name}`;
const description = `The music buffs at Saavn have created music playlists which include a huge variety of songs from various genres such as festivals, devotional, film, wedding, dance & more.`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,

    url: "/playlist",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/f595784c3c1e13c2e23db.png`,
      alt: "Top Featured Playlists",
    },
  },
};
type PageProps = { searchParams: Promise<{ page?: number; lang?: Lang }> };

export default async function PlaylistsPage({ searchParams }: PageProps) {
  const { page = 1, lang } = await searchParams;

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
