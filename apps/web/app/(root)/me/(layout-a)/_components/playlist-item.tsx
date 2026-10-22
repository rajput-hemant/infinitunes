import type { PlaylistSummary } from "@infinitunes/core/react/optimistic-playlists";
import type { SongObj } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import Link from "next/link";

import { GlassSurface } from "~/components/glass/glass-surface";
import { ImageCollage } from "~/components/image-collage";
import { PlaylistManageMenu } from "~/components/playlist/playlist-manage-menu";
import { PlaylistCaption } from "~/components/playlist/playlist-overlay";
import { api } from "~/lib/trpc/server";
import { asRoute } from "~/lib/utils";

export async function PlaylistItem({
  playlist,
}: {
  playlist: PlaylistSummary;
}) {
  const { id, name, description, songCount, coverSongs } = playlist;

  let songsDetails: SongObj | undefined;

  if (coverSongs.length) {
    try {
      songsDetails = await api.song.details({ id: coverSongs.join(",") });
    } catch (error) {
      // Cover art is decoration: show the placeholder instead of failing the
      // whole library page for one playlist.
      console.error(`playlist ${id}: failed to fetch cover songs`, error);
    }
  }

  const imageSrcs = songsDetails?.songs.length
    ? songsDetails.songs.map((song) => getImageSrc(song.image, "medium"))
    : ["/images/placeholder/song.jpg"];

  return (
    <div
      title={name}
      className="group w-32 shrink-0 p-2 sm:w-36 md:w-48 lg:w-56"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md shadow-sm transition-shadow duration-base group-hover:shadow-md">
        <Link
          href={asRoute(`/me/playlist/${id}`)}
          className="absolute inset-0 z-10 rounded-md outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="sr-only">View {name}</span>
        </Link>

        {/* A chip over artwork: frosted glass, no lens (one per card, and a small target). */}
        <GlassSurface
          size="s"
          lens="off"
          variant="clear"
          className="absolute top-1 right-1 z-20 rounded-full transition-opacity motion-reduce:transition-none pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100"
        >
          <PlaylistManageMenu playlist={{ id, name, description }} />
        </GlassSurface>

        <ImageCollage src={songCount > 4 ? imageSrcs : [imageSrcs[0]]} />

        <Skeleton className="absolute inset-0 -z-10 size-full" />
      </div>

      <PlaylistCaption
        id={id}
        name={name}
        description={description}
        songCount={songCount}
      />
    </div>
  );
}
