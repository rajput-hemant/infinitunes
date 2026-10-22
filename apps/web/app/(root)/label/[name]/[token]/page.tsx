import { Disc3 } from "lucide-react";
import { Suspense } from "react";

import { LibraryEmpty } from "~/components/library/library-section";
import { SongList } from "~/components/song-list/song-list";
import { SongListSkeleton } from "~/components/song-list/song-list-skeleton";

import { getLabel } from "./_components/label-data";

type LabelSongsPageProps = PageProps<"/label/[name]/[token]">;

async function SongsPanel({ params }: Pick<LabelSongsPageProps, "params">) {
  const { token } = await params;
  const label = await getLabel(token);

  return label.topSongs.songs.length > 0 ? (
    <SongList items={label.topSongs.songs} />
  ) : (
    <LibraryEmpty
      icon={Disc3}
      title="No songs yet"
      titleAs="p"
      description="This label has no songs to show right now."
    />
  );
}

export default function LabelSongsPage({ params }: LabelSongsPageProps) {
  return (
    <Suspense fallback={<SongListSkeleton length={20} />}>
      <SongsPanel params={params} />
    </Suspense>
  );
}
