import type { Metadata } from "next";

import { DetailsHeader } from "@/components/details-header";
import { getEpisodeDetails } from "@/lib/jiosaavn-api";

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

  const episodeObj = await getEpisodeDetails(token);
  const episode = episodeObj.episodes[0];

  return {
    title: episode.name,
    description: episode.subtitle,
    openGraph: {
      title: episode.name,
      description: episode.subtitle,
      url: `/episode/${name}/${token}`,
      images: {
        url: `/api/og?title=${episode.name}&description=${episode.subtitle}&image=${episode.image[2].link}&square=true`,
        alt: episode.name,
      },
    },
  };
}
export default async function EpisodeDetailsPage(props: EpisodeDetailsProps) {
  const { token } = await props.params;

  const episodeObj = await getEpisodeDetails(token);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={episodeObj.episodes[0]} />

      <h2 className="font-heading text-2xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
        {episodeObj.modules.episode_details.title}
      </h2>

      <p className="max-w-3xl text-muted-foreground">
        {episodeObj.episodes[0].description}
      </p>
    </div>
  );
}
