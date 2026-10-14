import { Suspense } from "react";

import { SongList } from "~/components/song-list/song-list";

import { getArtist } from "./_components/artist-data";
import { ArtistOverviewSkeleton } from "./_components/artist-skeleton";

type ArtistOverviewPageProps = PageProps<"/artist/[name]/[token]">;

async function OverviewPanel({
  params,
}: Pick<ArtistOverviewPageProps, "params">) {
  const { token } = await params;
  const artist = await getArtist(token);

  return (
    <div className="flex flex-col gap-(--page-gap)">
      <h2 className="pl-2 font-heading text-xl text-foreground sm:text-2xl md:text-3xl lg:pl-0">
        {artist.modules?.topSongs?.title}
      </h2>
      <SongList items={(artist.topSongs ?? []).slice(0, 10)} />
    </div>
  );
}

export default function ArtistOverviewPage({
  params,
}: ArtistOverviewPageProps) {
  return (
    <Suspense fallback={<ArtistOverviewSkeleton />}>
      <OverviewPanel params={params} />
    </Suspense>
  );
}
