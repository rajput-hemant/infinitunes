import Link from "next/link";

import type { Metadata } from "next";

import { DetailsHeader } from "@/components/details-header";
import { SliderCard } from "@/components/slider";
import { SongList } from "@/components/song-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLabelDetails } from "@/lib/jiosaavn-api";

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

  const label = await getLabelDetails(token);
  const description = "Record Label";

  return {
    title: label.name,
    description,
    openGraph: {
      title: label.name,
      description,
      url: `/label/${name}/${token}`,
      images: {
        url: `/api/og?title=${label.name}&description=${description}&image=${label.image[1].link}&square=true`,
        alt: label.name,
      },
    },
  };
}

const TABS = {
  Songs: "Songs",
  Albums: "Albums",
};

export default async function LabelDetailsPage(props: LabelDetailsPageProps) {
  const { name, token } = await props.params;

  const label = await getLabelDetails(token);

  return (
    <div className="mb-4 space-y-4">
      <DetailsHeader item={label} />

      <Tabs defaultValue={name.endsWith("-songs") ? TABS.Songs : TABS.Albums}>
        <TabsList className="mx-auto flex max-w-fit lg:mx-0">
          {Object.entries(TABS).map(([key, value]) => (
            <TabsTrigger key={key} value={value} asChild>
              <Link
                href={`/label/${name.replace(
                  /-(songs|albums)$/,
                  value === TABS.Songs ? "-songs" : "-albums"
                )}/${token}`}
              >
                {value}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={TABS.Songs}>
          <SongList items={label.top_songs.songs} />
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <div className="flex w-full flex-wrap justify-between gap-y-4">
            {label.top_albums.albums.map(
              ({ id, name, url, subtitle, type, image }) => (
                <SliderCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
