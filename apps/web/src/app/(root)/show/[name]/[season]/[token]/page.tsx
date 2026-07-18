import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { Metadata } from "next";
import type { Sort } from "@/types";

import { DetailsHeader } from "@/components/details-header";
import { SliderCard } from "@/components/slider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getUser } from "@/lib/auth";
import { getUserFavorites, getUserPlaylists } from "@/lib/db/queries";
import { getShowDetails } from "@/lib/jiosaavn-api";
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
    title: show.name,
    description: show.subtitle,
    openGraph: {
      title: show.name,
      description: show.subtitle,
      url: `/show/${name}/${season}/${token}`,
      images: {
        url: `/api/og?title=${show.name}&description=${show.subtitle}&image=${show.image[2].link}&square=true`,
        alt: show.name,
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
          {seasons
            .reverse()
            .map(({ id, name, url, subtitle, image, season_number }) => (
              <SliderCard
                key={id}
                name={name}
                url={url}
                subtitle={subtitle}
                type="show"
                image={image}
                aspect="video"
                hidePlayButton
                isCurrentSeason={season == season_number && seasons.length > 1}
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
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="w-28 md:w-36">
              {sort === "asc" ? "Oldest" : "Newest"}
              <ChevronDown className="ml-auto size-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-28 *:cursor-pointer md:w-36">
            <DropdownMenuItem asChild>
              <Link href="?sort=desc">Newest</Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="?sort=asc">Oldest</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EpisodeList
        key={episodes[0].id}
        user={user}
        showId={show_details.id}
        season={show_details.season_number}
        sort={sort}
        totalEpisodes={show_details.total_episodes}
        initialEpisodes={episodes}
        userFavorites={favorites}
        userPlaylists={playlists}
      />

      <h2 className="font-heading text-xl drop-shadow-md sm:text-2xl md:text-3xl">
        {modules.show_details.title}
      </h2>

      <blockquote className="max-w-4xl italic text-muted-foreground">
        {show_details.description}
      </blockquote>
    </div>
  );
}
