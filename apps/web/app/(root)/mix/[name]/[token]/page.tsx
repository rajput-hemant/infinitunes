import type { Mix } from "@infinitunes/types";
import type { Metadata } from "next";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SongList } from "~/components/song-list/song-list";
import { api } from "~/lib/trpc/server";
import { getImageSrc, ogImageUrl } from "~/lib/utils";

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

  const mix = (await api.get.mix({
    token,
    page: 1,
    n: 20,
    lang: "hindi,english",
  })) as unknown as Mix;

  return {
    title: mix.title,
    description: mix.subtitle,
    openGraph: {
      title: mix.title,
      description: mix.subtitle,
      url: `/mix/${name}/${token}`,
      images: {
        url: ogImageUrl({
          title: mix.title,
          description: mix.subtitle,
          image: getImageSrc(mix.image, "high"),
          square: true,
        }),
        alt: mix.title,
      },
    },
  };
}
export default async function MixDetailsPage(props: MixDetailsPageProps) {
  const { token } = await props.params;

  const mix = (await api.get.mix({
    token,
    page: 1,
    n: 20,
    lang: "hindi,english",
  })) as unknown as Mix;

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={mix} />

      <SongList items={Array.isArray(mix.list) ? mix.list : []} />
    </div>
  );
}
