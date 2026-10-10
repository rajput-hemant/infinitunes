import type { Sort } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
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
import { cache, Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SongListSkeleton } from "~/components/skeletons/song-list-skeleton";
import { SliderCard } from "~/components/slider/slider-card";
import { getUser } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";
import { asRoute, cn } from "~/lib/utils";

import { EpisodeList } from "./_components/episode-list";

const DEFAULT_SORT: Sort = "desc";

// callers must pass a normalized sort so generateMetadata and the page share one cache entry
const getShow = cache(async (token: string, season: number, sort: Sort) =>
  orNotFound(
    api.show.details({
      token,
      season: `${season}`,
      sort,
    }),
  ),
);

type ShowDetailsPageProps = {
  searchParams: Promise<{ sort?: Sort }>;
  params: Promise<{ name: string; season: number; token: string }>;
};

export async function generateMetadata({
  params,
}: ShowDetailsPageProps): Promise<Metadata> {
  const { name, season, token } = await params;

  const { show_details: show } = await getShow(token, season, DEFAULT_SORT);

  return pageMetadata({
    title: show.title,
    description: show.subtitle,
    url: `/show/${name}/${season}/${token}`,
    image: getImageSrc(show.image, "high"),
    square: true,
  });
}

async function ShowEpisodeSection({
  show,
  sort,
  userPromise,
}: {
  show: Awaited<ReturnType<typeof getShow>>;
  sort: Sort;
  userPromise: ReturnType<typeof getUser>;
}) {
  const user = await userPromise;
  const [favorites, playlists] = user
    ? await Promise.all([
        orFallback("user favorites", getUserFavorites(), null),
        orFallback("user playlists", getUserPlaylists(), undefined),
      ])
    : [undefined, undefined];

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-foreground sm:text-2xl md:text-3xl">
          {show.modules.episodes.title}
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className={cn(controlStyles.text, "w-28 md:w-36")}
              >
                {sort === "asc" ? "Oldest" : "Newest"}
                <ChevronDown className="ml-auto size-5" />
              </Button>
            }
          />

          <DropdownMenuContent className="w-28 *:cursor-pointer md:w-36">
            <DropdownMenuItem
              render={<Link href={asRoute("?sort=desc")}>Newest</Link>}
            />
            <DropdownMenuItem
              render={<Link href={asRoute("?sort=asc")}>Oldest</Link>}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EpisodeList
        key={show.episodes[0]?.id}
        user={user}
        showId={show.show_details.id}
        season={Number(show.show_details.more_info.season_number)}
        sort={sort}
        totalEpisodes={Number(show.show_details.more_info.total_episodes)}
        initialEpisodes={show.episodes}
        userFavorites={favorites}
        userPlaylists={playlists}
      />
    </>
  );
}

export default async function ShowDetailsPage(props: ShowDetailsPageProps) {
  const { sort = DEFAULT_SORT } = await props.searchParams;
  const { season, token } = await props.params;

  const userPromise = getUser();
  userPromise.catch(() => undefined);
  const show = await getShow(token, season, sort);
  const { modules, seasons, show_details } = show;

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeader item={show_details} />

      <section className="flex flex-col gap-4">
        <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
          {modules.show_details.title}
        </h2>
        <p className="max-w-2xl text-muted-foreground">
          {show_details.more_info.description}
        </p>
      </section>

      <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
        {modules.seasons.title}
      </h2>

      <ScrollArea>
        <div className="flex space-x-4 p-1 pb-4">
          {seasons.toReversed().map((s) => (
            <SliderCard
              key={s.id}
              name={s.title}
              url={s.perma_url}
              subtitle={s.subtitle}
              type="show"
              image={s.image}
              aspect="video"
              hidePlayButton
              isCurrentSeason={
                Number(season) === Number(s.more_info.season_number) &&
                seasons.length > 1
              }
            />
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Suspense
        fallback={
          <>
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            <SongListSkeleton length={10} />
          </>
        }
      >
        <ShowEpisodeSection show={show} sort={sort} userPromise={userPromise} />
      </Suspense>
    </div>
  );
}
