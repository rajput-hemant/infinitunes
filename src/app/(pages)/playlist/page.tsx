import LanguageBar from "@/components/language-bar";
import { Separator } from "@/components/ui/separator";
import { H2 } from "@/components/ui/topography";
import { getFeaturedPlaylists } from "@/lib/jiosaavn-api";
import { Lang } from "@/types";
import FeaturedPlaylists from "./featured-playlists";

export const revalidate = 3600; // revalidate page every hour

type Props = { searchParams: { page?: number; lang?: Lang } };

const PlaylistsPage = async ({ searchParams: { page = 1, lang } }: Props) => {
  const featuredPlaylists = await getFeaturedPlaylists(page, 50, lang);

  const heading =
    lang ?
      `${lang[0].toUpperCase() + lang.slice(1)} Music Playlists`
    : "Top Playlists";

  return (
    <div className="mb-4 space-y-4">
      <H2 className="pb-0 lg:hidden">{heading}</H2>

      <LanguageBar type="playlist" language={lang} />

      <Separator />

      <H2 className="hidden lg:block">{heading}</H2>

      <FeaturedPlaylists initialPlaylists={featuredPlaylists} />
    </div>
  );
};

export default PlaylistsPage;
