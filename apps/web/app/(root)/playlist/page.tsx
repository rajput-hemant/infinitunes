import type { Lang } from "@infinitunes/types";

import { LanguageBar } from "~/components/language-bar";
import { siteConfig } from "~/config/site";
import { pageMetadata } from "~/lib/metadata";
import { api } from "~/lib/trpc/server";

import { FeaturedPlaylists } from "./_components/featured-playlists";

const title = ` Best Songs ${new Date().getFullYear()} - Online Downloads and Playlists @${siteConfig.name}`;
const description = `The music buffs at Saavn have created music playlists which include a huge variety of songs from various genres such as festivals, devotional, film, wedding, dance & more.`;

export const metadata = pageMetadata({
  title,
  description,
  url: "/playlist",
  alt: "Top Featured Playlists",
});
type PageProps = { searchParams: Promise<{ page?: number; lang?: Lang }> };

export default async function PlaylistsPage({ searchParams }: PageProps) {
  const { page = 1, lang } = await searchParams;

  const featuredPlaylists = await api.get.featuredPlaylists({
    page,
    n: 50,
    lang,
  });

  return (
    <div className="space-y-4">
      <LanguageBar language={lang} />

      <h1 className="font-heading text-2xl capitalize dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
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
