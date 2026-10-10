import { getImageSrc } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

const getEpisode = cache(async (token: string) =>
  orNotFound(
    api.show.episodeDetails({
      token,
      season: 1,
      sort: "desc",
    }),
  ),
);

type EpisodeDetailsProps = {
  params: Promise<{
    name: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: EpisodeDetailsProps): Promise<Metadata> {
  const { name, token } = await params;

  const episodeObj = await getEpisode(token);
  const episode = episodeObj.episodes[0];

  return pageMetadata({
    title: episode.title,
    description: episode.subtitle,
    url: `/episode/${name}/${token}`,
    image: getImageSrc(episode.image, "high"),
    square: true,
  });
}
export default async function EpisodeDetailsPage(props: EpisodeDetailsProps) {
  const { token } = await props.params;

  const episodeObj = await getEpisode(token);

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeader item={episodeObj.episodes[0]} />

      <section className="flex max-w-2xl flex-col gap-4 rounded-md bg-card p-6 ring-1 ring-inset ring-border">
        <h2 className="font-heading text-xl capitalize text-foreground sm:text-2xl md:text-3xl">
          {episodeObj.modules.episode_details.title}
        </h2>
        <p className="text-muted-foreground">
          {episodeObj.episodes[0].more_info.description}
        </p>
      </section>
    </div>
  );
}
