import { getImageSrc, toSongRow, uniqueBy } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { KeyedByParams } from "~/components/search-params-boundary";
import { Shelf } from "~/components/slider/shelf";
import { ShelfItem } from "~/components/slider/shelf-item";
import { SliderCard } from "~/components/slider/slider-card";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { DEFAULT_SORT, readSort } from "~/lib/sort";
import { api } from "~/lib/trpc/server";
import { getViewer } from "~/lib/viewer";

import { EpisodeList } from "./_components/episode-list";
import { EpisodeSortMenu } from "./_components/episode-sort-menu";
import { EpisodesSkeleton } from "./_components/episodes-skeleton";

// The shell never depends on `?sort=`: the header, about text and seasons are fetched once at
// the default order, so a sort switch leaves them mounted and only the episode section reloads.
const getShow = cache(async (token: string, season: string) =>
  orNotFound(
    api.show.details({
      token,
      season,
      sort: DEFAULT_SORT,
    }),
  ),
);

type ShowDetailsPageProps = {
  searchParams: Promise<{ sort?: string | string[] }>;
  params: Promise<{ name: string; season: string; token: string }>;
};

export async function generateMetadata({
  params,
}: Pick<ShowDetailsPageProps, "params">): Promise<Metadata> {
  const { name, season, token } = await params;

  const { show_details: show } = await getShow(token, season);

  return pageMetadata({
    title: show.title,
    description: show.subtitle,
    url: `/show/${name}/${season}/${token}`,
    image: getImageSrc(show.image, "high"),
    square: true,
  });
}

type ShowEpisodeSectionProps = Pick<
  ShowDetailsPageProps,
  "params" | "searchParams"
>;

/** The one sort-dependent part of the page: `KeyedByParams` swaps it for its skeleton on every `?sort=` change. */
async function ShowEpisodeSection({
  params,
  searchParams,
}: ShowEpisodeSectionProps) {
  const sort = readSort((await searchParams).sort);
  const { season, token } = await params;
  const show = await getShow(token, season);
  const seasonNumber = Number(show.show_details.more_info.season_number);
  const [episodes, { user, favorites, playlists }] = await Promise.all([
    api.show.episodes({
      id: show.show_details.id,
      season: seasonNumber,
      page: 1,
      sort,
    }),
    getViewer(),
  ]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-foreground sm:text-2xl md:text-3xl">
          {show.modules.episodes.title}
        </h2>

        <EpisodeSortMenu sort={sort} />
      </div>

      <EpisodeList
        key={`${sort}-${episodes[0]?.id}`}
        user={user}
        showId={show.show_details.id}
        season={seasonNumber}
        sort={sort}
        totalEpisodes={Number(show.show_details.more_info.total_episodes)}
        initialEpisodes={episodes.map(toSongRow)}
        userFavorites={favorites}
        userPlaylists={playlists}
      />
    </>
  );
}

export default async function ShowDetailsPage(props: ShowDetailsPageProps) {
  const { season, token } = await props.params;

  const show = await getShow(token, season);
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

      <Shelf
        heading={
          <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
            {modules.seasons.title}
          </h2>
        }
      >
        {uniqueBy(seasons.toReversed(), (entry) => entry.id).map((s) => (
          <ShelfItem key={s.id}>
            <SliderCard
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
          </ShelfItem>
        ))}
      </Shelf>

      <KeyedByParams params={["sort"]} fallback={<EpisodesSkeleton />}>
        <ShowEpisodeSection
          params={props.params}
          searchParams={props.searchParams}
        />
      </KeyedByParams>
    </div>
  );
}
