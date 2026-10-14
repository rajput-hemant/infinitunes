import { getImageSrc } from "@infinitunes/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { detailPanelClassName } from "~/components/details-header/details-header-band";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";

// An episode token that resolves to no episode renders the 404 UI.
const getEpisode = cache(async (token: string) => {
  const detail = await orNotFound(
    api.show.episodeDetails({
      token,
      season: 1,
      sort: "desc",
    }),
  );
  const episode = detail.episodes[0];
  if (!episode) notFound();
  return { episode, modules: detail.modules };
});

type EpisodeDetailsPageProps = {
  params: Promise<{
    name: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: EpisodeDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const { episode } = await getEpisode(token);

  return pageMetadata({
    title: episode.title,
    description: episode.subtitle,
    url: `/episode/${name}/${token}`,
    image: getImageSrc(episode.image, "high"),
    square: true,
  });
}
export default async function EpisodeDetailsPage(
  props: EpisodeDetailsPageProps,
) {
  const { token } = await props.params;

  const { episode, modules } = await getEpisode(token);

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeader item={episode} />

      <section className={detailPanelClassName}>
        <h2 className="font-heading text-xl capitalize text-foreground sm:text-2xl md:text-3xl">
          {modules.episode_details.title}
        </h2>
        <p className="text-muted-foreground">{episode.more_info.description}</p>
      </section>
    </div>
  );
}
