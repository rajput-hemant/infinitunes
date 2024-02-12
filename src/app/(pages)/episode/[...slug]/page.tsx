import { DetailsHeader } from "@/components/details-header";
import { H3, Small } from "@/components/ui/topography";
import { getEpisodeDetails } from "@/lib/jiosaavn-api";

type Props = { params: { slug: [string, string] } };

const EpisodeDetailsPage = async ({ params: { slug } }: Props) => {
  const episodeObj = await getEpisodeDetails(slug[1]);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={episodeObj.episodes[0]} />

      <H3>{episodeObj.modules.episode_details.title}</H3>
      <Small className="max-w-3xl leading-3">
        {episodeObj.episodes[0].description}
      </Small>
    </div>
  );
};

export default EpisodeDetailsPage;
