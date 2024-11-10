import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { ImageCollage } from "@/components/image-collage";
import { PlayButton } from "@/components/play-button";
import { SongList } from "@/components/song-list";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlaylistDetails } from "@/lib/db/queries";
import { getSongDetails } from "@/lib/jiosaavn-api";
import { cn, formatDuration, getImageSrc } from "@/lib/utils";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const playlist = await getPlaylistDetails(id);

  if (!playlist) {
    return {
      title: "Unknown Playlist",
      description: "This playlist does not exist.",
    };
  }

  return {
    title: playlist.name,
    description: playlist.description,
    openGraph: {
      title: playlist.name,
      description: playlist.description ?? "No description available",
      url: `/me/playlist/${id}`,
    },
  };
}

export default async function MyPlaylistsPage(props: Props) {
  const { id } = await props.params;

  const playlist = await getPlaylistDetails(id);

  if (!playlist) {
    return notFound();
  }

  const { name, description, songs } = playlist;

  let songsDetails;

  if (songs.length) {
    songsDetails = await getSongDetails(songs);
  }

  const imageSrcs = songsDetails?.songs
    .slice(0, 4)
    .map((song) => getImageSrc(song.image, "medium")) ?? [
    "/images/placeholder/song.jpg",
  ];

  return (
    <div className="space-y-4">
      <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-md border p-1 shadow-md transition-[width_shadow] duration-500 hover:shadow-xl md:w-56 xl:w-64">
          <ImageCollage src={imageSrcs} />

          <Skeleton className="absolute inset-0 -z-10" />
        </div>

        <figcaption className="flex w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
          <h1
            title={name}
            className="flex items-center truncate text-center font-heading text-xl capitalize drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:text-start"
          >
            {name}
          </h1>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{description}</p>
            <p>
              <span>{songs.length} Songs</span>
              {songsDetails && songsDetails.songs.length && (
                <span>
                  {" · "}
                  {formatDuration(
                    songsDetails.songs.reduce(
                      (acc, song) => acc + song.duration,
                      0
                    ),
                    "mm:ss"
                  )}
                </span>
              )}
            </p>
          </div>

          {songsDetails && songsDetails.songs.length && (
            <div className="mt-4 flex gap-2 lg:mt-6">
              <PlayButton
                type="song"
                // @ts-expect-error string[] is not assignable to string
                token={songs}
                className={cn(
                  buttonVariants(),
                  "rounded-full px-10 text-xl font-bold shadow-sm"
                )}
              >
                Play
              </PlayButton>
            </div>
          )}
        </figcaption>
      </figure>

      {songsDetails && songsDetails.songs.length ?
        <>
          <SongList items={songsDetails.songs} />

          <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
            <em>Yay! You have seen it all</em>{" "}
            <span className="text-foreground">🤩</span>
          </h3>
        </>
      : <div className="h-96">
          <h3 className="py-6 text-center font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl">
            <em>Nothing to see here</em> 😢
            <p>Try addding songs to the playlist</p>
          </h3>
        </div>
      }
    </div>
  );
}
