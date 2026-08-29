import type { EpisodeDetail } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { api } from "~/lib/trpc/server";
import { getImageSrc, ogImageUrl } from "~/lib/utils";

const getEpisode = cache(
  async (token: string) =>
    (await api.show.episodeDetails({
      token,
      season: 1,
      sort: "desc",
    })) as unknown as EpisodeDetail,
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

  return {
    title: episode.title,
    description: episode.subtitle,
    openGraph: {
      title: episode.title,
      description: episode.subtitle,
      url: `/episode/${name}/${token}`,
      images: {
        url: ogImageUrl({
          title: episode.title,
          description: episode.subtitle,
          image: getImageSrc(episode.image, "high"),
          square: true,
        }),
        alt: episode.title,
      },
    },
  };
}
export default async function EpisodeDetailsPage(props: EpisodeDetailsProps) {
  const { token } = await props.params;

  const episodeObj = await getEpisode(token);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={episodeObj.episodes[0]} />

      <h2 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-linear-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        {episodeObj.modules.episode_details.title}
      </h2>

      <p className="max-w-3xl text-muted-foreground">
        {episodeObj.episodes[0].more_info.description}
      </p>
    </div>
  );
}
