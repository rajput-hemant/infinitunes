import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Lang } from "@/types";
import { getFeaturedPlaylists } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import { ItemCard } from "@/components/item-card";
import LanguageBar from "@/components/language-bar";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { H2, H3 } from "@/components/ui/topography";

type Props = { searchParams: { page?: string; lang?: Lang } };

const PlaylistsPage = async ({ searchParams: { page = "1", lang } }: Props) => {
  const { data: featuredPlaylists, last_page } = await getFeaturedPlaylists(
    page,
    lang
  );

  const heading = lang
    ? `${lang[0].toUpperCase() + lang.slice(1)} Music Playlists`
    : "Top Playlists";

  return (
    <div className="space-y-4">
      <H2 className="pb-0 lg:hidden">{heading}</H2>

      <LanguageBar type="playlist" language={lang} />

      <Separator />

      <H2 className="hidden lg:block">{heading}</H2>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {featuredPlaylists.map(
          ({ id, name, url, subtitle, type, image, explicit }) => (
            <ItemCard
              key={id}
              name={name}
              url={url}
              subtitle={subtitle}
              type={type}
              image={image}
              explicit={explicit}
            />
          )
        )}
      </div>

      {lang ? (
        <H3 className="text-center italic">Yay! You have seen it all 🤩</H3>
      ) : (
        <div className="flex items-center justify-between gap-10">
          <Link
            href={`/playlist?page=${+page - (page === "1" ? 0 : 1)}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "group w-full font-bold",
              page === "1" &&
                "cursor-not-allowed bg-muted !text-muted-foreground"
            )}
          >
            <ArrowLeft
              className={cn(
                "mr-2 h-4 w-4 duration-300",
                page !== "1" && "group-hover:-translate-x-2"
              )}
            />
            Prev
          </Link>

          <Link
            href={`/playlist?page=${+page + (last_page ? 0 : 1)}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "group w-full font-bold",
              last_page && "cursor-not-allowed bg-muted !text-muted-foreground"
            )}
          >
            Next
            <ArrowRight
              className={cn(
                "mr-2 h-4 w-4 duration-300",
                !last_page && "group-hover:translate-x-2"
              )}
            />{" "}
          </Link>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
