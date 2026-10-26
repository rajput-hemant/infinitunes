import { uniqueBy } from "@infinitunes/types";
import { Disc3 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { LibraryEmpty } from "~/components/library/library-section";
import { SliderCard } from "~/components/slider/slider-card";

import { getLabel, labelTabMetadata } from "../_components/label-data";
import { LabelAlbumsSkeleton } from "../_components/label-skeleton";

type LabelAlbumsPageProps = PageProps<"/label/[name]/[token]/albums">;

export async function generateMetadata({
  params,
}: LabelAlbumsPageProps): Promise<Metadata> {
  const { name, token } = await params;

  return labelTabMetadata(await getLabel(token), name, token, "albums");
}

async function AlbumsPanel({ params }: Pick<LabelAlbumsPageProps, "params">) {
  const { token } = await params;
  const { albums } = (await getLabel(token)).topAlbums;

  if (albums.length === 0) {
    return (
      <LibraryEmpty
        icon={Disc3}
        title="No albums yet"
        titleAs="p"
        description="This label has no albums to show right now."
      />
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6 max-sm:gap-4">
      {uniqueBy(albums, (album) => album.id).map(
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
  );
}

export default function LabelAlbumsPage({ params }: LabelAlbumsPageProps) {
  return (
    <Suspense fallback={<LabelAlbumsSkeleton />}>
      <AlbumsPanel params={params} />
    </Suspense>
  );
}
