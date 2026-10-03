import { getImageSrc } from "@infinitunes/types";
import type { Metadata } from "next";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SongList } from "~/components/song-list/song-list";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

const getMix = cache(async (token: string) =>
  orNotFound(api.get.mix({ token, page: 1, n: 20, lang: "hindi,english" })),
);

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

  const mix = await getMix(token);

  return pageMetadata({
    title: mix.title,
    description: mix.subtitle,
    url: `/mix/${name}/${token}`,
    image: getImageSrc(mix.image, "high"),
    square: true,
  });
}
export default async function MixDetailsPage(props: MixDetailsPageProps) {
  const { token } = await props.params;

  const mix = await getMix(token);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={mix} />

      <SongList items={Array.isArray(mix.list) ? mix.list : []} />
    </div>
  );
}
