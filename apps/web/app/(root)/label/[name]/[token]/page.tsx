import { getImageSrc } from "@infinitunes/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@infinitunes/ui/components/tabs";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { SliderCard } from "~/components/slider/slider-card";
import { SongList } from "~/components/song-list/song-list";
import { pageMetadata } from "~/lib/metadata";
import { orNotFound } from "~/lib/not-found";
import { api } from "~/lib/trpc/server";
import { asRoute } from "~/lib/utils";

const getLabel = cache(async (token: string) =>
  orNotFound(
    api.get.label({
      token,
      page: 0,
      n_song: 50,
      n_album: 50,
      cat: "popularity",
      sort: "asc",
    }),
  ),
);

type LabelDetailsPageProps = {
  params: Promise<{
    name: string;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: LabelDetailsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  const label = await getLabel(token);

  return pageMetadata({
    title: label.name,
    description: "Record Label",
    url: `/label/${name}/${token}`,
    image: getImageSrc(label.image, "high"),
    square: true,
  });
}

export default async function LabelDetailsPage(props: LabelDetailsPageProps) {
  const { name, token } = await props.params;

  const label = await getLabel(token);
  const tabHref = (tab: "songs" | "albums") =>
    asRoute(`/label/${name.replace(/-(songs|albums)$/, `-${tab}`)}/${token}`);

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <DetailsHeader item={label} />

      <Tabs defaultValue={name.endsWith("-songs") ? "Songs" : "Albums"}>
        <TabsList className="mx-auto flex max-w-fit lg:mx-0">
          <TabsTrigger
            value="Songs"
            render={<Link href={tabHref("songs")}>Songs</Link>}
          />
          <TabsTrigger
            value="Albums"
            render={<Link href={tabHref("albums")}>Albums</Link>}
          />
        </TabsList>

        <TabsContent value="Songs">
          <SongList items={label.topSongs.songs} />
        </TabsContent>

        <TabsContent value="Albums">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6 max-sm:gap-4">
            {label.topAlbums.albums.map(
              ({ id, title, perma_url, subtitle, type, image }) => (
                <SliderCard
                  key={id}
                  name={title}
                  url={perma_url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                />
              ),
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
