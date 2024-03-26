import { DetailsHeader } from "@/components/details-header";
import { getEpisodeDetails } from "@/lib/jiosaavn-api";

type EpisodeDetailsProps = {
  params: {
    name: string;
    token: string;
  };
};

export default async function EpisodeDetailsPage(props: EpisodeDetailsProps) {
  const episodeObj = await getEpisodeDetails(props.params.token);

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
