import LanguageBar from "@/components/language-bar";
import { Separator } from "@/components/ui/separator";
import { H2 } from "@/components/ui/topography";
import { getTopAlbums } from "@/lib/jiosaavn-api";
import { Lang } from "@/types";
import TopAlbums from "./top-albums";

export const revalidate = 3600; // revalidate page every hour

type Props = { searchParams: { page?: number; lang?: Lang } };

const AlbumsPage = async ({ searchParams: { page = 1, lang } }: Props) => {
  const topAlbums = await getTopAlbums(page, 50, lang);
  const heading = `New ${
    lang ? lang[0].toUpperCase() + lang.slice(1) : ""
  } Songs`;

  return (
    <div className="mb-4 space-y-4">
      <H2 className="pb-0 lg:hidden">{heading}</H2>

      <LanguageBar type="album" language={lang} />

      <Separator />

      <H2 className="hidden lg:block">{heading}</H2>

      <TopAlbums initialAlbums={topAlbums} />
    </div>
  );
};

export default AlbumsPage;
