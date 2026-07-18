import type { Metadata } from "next";

import { DetailsHeader } from "@/components/details-header";
import { SongList } from "@/components/song-list";
import { getMixDetails } from "@/lib/jiosaavn-api";

type MixDetailsPageProps = {
  params: Promise<{
    name: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: MixDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const mix = await getMixDetails(token);

  return {
    title: mix.name,
    description: mix.subtitle,
    openGraph: {
      title: mix.name,
      description: mix.subtitle,
      url: `/mix/${name}/${token}`,
      images: {
        url: `/api/og?title=${mix.name}&description=${mix.subtitle}&image=${mix.image[1].link}&square=true`,
        alt: mix.name,
      },
    },
  };
}
export default async function MixDetailsPage(props: MixDetailsPageProps) {
  const { token } = await props.params;

  const mix = await getMixDetails(token);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={mix} />

      <SongList items={mix.songs} />
    </div>
  );
}
