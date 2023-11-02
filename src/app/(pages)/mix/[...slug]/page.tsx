import { getMixDetails } from "@/lib/jiosaavn-api";
import { DetailsHeader } from "@/components/details-header";
import { SongList } from "@/components/song/song-list";

type Props = { params: { slug: [string, string] } };

const MixDetailsPage = async ({ params: { slug } }: Props) => {
  const mix = await getMixDetails(slug[1]);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={mix} />

      <SongList items={mix.songs} />
    </div>
  );
};

export default MixDetailsPage;
