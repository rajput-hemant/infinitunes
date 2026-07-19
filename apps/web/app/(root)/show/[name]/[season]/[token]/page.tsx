import { Button } from "@infinitunes/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { ScrollArea, ScrollBar } from "@infinitunes/ui/components/scroll-area";
import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DetailsHeader } from "~/components/details-header";
import { SliderCard } from "~/components/slider";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { getShowDetails } from "~/lib/jiosaavn-api";
import { getImageSrc } from "~/lib/utils";
import type { Sort } from "~/types";

import { EpisodeList } from "./_components/episode-list";

type ShowDetailsPageProps = {
  searchParams: Promise<{ sort: Sort }>;
  params: Promise<{ name: string; season: number; token: string }>;
};

export async function generateMetadata({
  params,
}: ShowDetailsPageProps): Promise<Metadata> {
  const { name, season, token } = await params;

  const { show_details: show } = await getShowDetails(token, season);

  return {
    title: show.title,
    description: show.subtitle,
    openGraph: {
      title: show.title,
      description: show.subtitle,
      url: `/show/${name}/${season}/${token}`,
      images: {
        url: `/api/og?title=${show.title}&description=${show.subtitle}&image=${getImageSrc(show.image, "high")}&square=true`,
        alt: show.title,
      },
    },
  };
}

export default async function ShowDetailsPage(props: ShowDetailsPageProps) {
  const { sort } = await props.searchParams;
  const { season, token } = await props.params;

  const user = await getUser();

  const [{ episodes, modules, seasons, show_details }, favorites, playlists] =
    await Promise.all([
      getShowDetails(token, season, sort),
      user ? getUserFavorites(user.id) : undefined,
      user ? getUserPlaylists(user.id) : undefined,
    ]);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={show_details} />

      <h2 className="font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        {modules.seasons.title}
      </h2>

      <ScrollArea>
        <div className="flex space-x-4 p-1 pb-4">
          {seasons.reverse().map((s) => (
            <SliderCard
              key={s.id}
              title={s.title}
              perma_url={s.perma_url}
              subtitle={s.subtitle}
              type="show"
              image={s.image}
              aspect="video"
              hidePlayButton
              isCurrentSeason={
                season == Number(s.more_info.season_number) &&
                seasons.length > 1
              }
            />
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
          {modules.episodes.title}
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="outline" className="w-28 md:w-36">
                {sort === "asc" ? "Oldest" : "Newest"}
                <ChevronDown className="ml-auto size-5" />
              </Button>
            }
          />

          <DropdownMenuContent className="w-28 *:cursor-pointer md:w-36">
            <DropdownMenuItem render={<Link href="?sort=desc">Newest</Link>} />

            <DropdownMenuItem render={<Link href="?sort=asc">Oldest</Link>} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EpisodeList
        key={episodes[0].id}
        user={user}
        showId={show_details.id}
        season={Number(show_details.more_info.season_number)}
        sort={sort}
        totalEpisodes={Number(show_details.more_info.total_episodes)}
        initialEpisodes={episodes}
        userFavorites={favorites}
        userPlaylists={playlists}
      />

      <h2 className="font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        {modules.show_details.title}
      </h2>

      <blockquote className="max-w-4xl italic text-muted-foreground">
        {show_details.more_info.description}
      </blockquote>
    </div>
  );
}
