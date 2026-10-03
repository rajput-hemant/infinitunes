import type { MyPlaylist } from "@infinitunes/db/schema";
import type { SongObj } from "@infinitunes/types";
import { getImageSrc } from "@infinitunes/types";
import { Card, CardContent } from "@infinitunes/ui/components/card";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import Link from "next/link";

import { ImageCollage } from "~/components/image-collage";
import { PlaylistManageMenu } from "~/components/playlist/playlist-manage-menu";
import { api } from "~/lib/trpc/server";
import { asRoute } from "~/lib/utils";

export async function PlaylistItem({ playlist }: { playlist: MyPlaylist }) {
  const { id, name, description, songs } = playlist;

  let songsDetails: SongObj | undefined;

  if (songs.length) {
    try {
      songsDetails = await api.song.details({
        id: songs.slice(0, 4).join(","),
      });
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
    <Card
      key={id}
      title={name}
      className="group w-32 cursor-pointer border-none bg-transparent shadow-none transition-shadow duration-200 hover:bg-accent hover:shadow-md sm:w-36 sm:border-solid md:w-48 lg:w-56"
    >
      <CardContent className="size-full p-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-md">
          <Link
            href={asRoute(`/me/playlist/${id}`)}
            className="absolute inset-0 z-10 rounded-md outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="sr-only">View {name}</span>
          </Link>

          <div className="absolute right-1 top-1 z-20 transition-opacity motion-reduce:transition-none pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100">
            <PlaylistManageMenu
              playlist={{ id, name, description }}
              triggerClassName="rounded-md bg-background/80 p-2.5 shadow-sm backdrop-blur-sm"
            />
          </div>

          <ImageCollage src={songs.length > 4 ? imageSrcs : [imageSrcs[0]]} />

          <Skeleton className="absolute inset-0 -z-10 size-full hover:scale-110" />
        </div>

        <div className="mt-1 flex w-full flex-col items-center justify-between">
          <h3 className="w-full font-semibold lg:text-lg">
            <span className="mx-auto flex max-w-fit items-center">
              <span className="truncate">{name}</span>
            </span>
          </h3>

          <span className="w-full truncate text-center text-xs capitalize text-secondary-foreground">
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
