import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { Episode, Song } from "@/types";
import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import LikeButton from "./like-button";
import SongTileDropDown from "./song-tile-dropdown";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

type Props = {
  songs: (Song | Episode)[];
  showAlbum?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const SongList = ({ songs, showAlbum = true, className, ...props }: Props) => {
  return (
    <div
      className={cn("text-muted-foreground space-y-2", className)}
      {...props}
    >
      {songs.map((song, i) => (
        <div
          key={song.id}
          className="hover:bg-accent group flex h-14 w-full cursor-pointer items-center rounded-md border pr-4 text-sm shadow-sm transition-shadow duration-150 hover:shadow-md"
        >
          <div className="flex w-[4%] justify-center">
            <span
              className={cn(
                "truncate font-medium",
                !showAlbum && "group-hover:hidden"
              )}
            >
              {i + 1}
            </span>

            {!showAlbum && (
              <span className="hover:text-primary border-muted-foreground group/play hover:border-primary hidden aspect-square h-8 items-center justify-center rounded-full border duration-300 hover:h-9 group-hover:flex">
                <Play
                  strokeWidth={10}
                  className="h-full w-5 p-1 duration-300 group-hover/play:w-6"
                />
              </span>
            )}
          </div>

          <div className="flex w-full items-center justify-between gap-4">
            {showAlbum && (
              <div className="relative aspect-square h-12 min-w-fit overflow-hidden rounded">
                <Image
                  src={getImageSrc(song.image, "low")}
                  alt={song.name}
                  fill
                  className="z-10 object-cover duration-300 group-hover:brightness-50"
                />

                <Skeleton className="absolute inset-0 rounded" />

                <Play
                  strokeWidth={10}
                  className="text-primary absolute inset-0 z-20 m-auto hidden h-full w-6 p-1 duration-300 hover:w-8 group-hover:block"
                />
              </div>
            )}

            <h3 className="w-full truncate font-semibold">
              <Link
                href={getHref(song.url, "song")}
                className="group-hover:text-primary"
              >
                {song.name}
              </Link>
            </h3>

            <p className="w-full truncate">
              <ScrollArea className="pb-1">
                {song.artist_map.primary_artists.map((artist, i) => (
                  <Link
                    key={artist.id}
                    href={getHref(artist.url, "artist")}
                    className="hover:text-foreground"
                  >
                    {artist.name}
                    {i !== song.artist_map.primary_artists.length - 1 && ", "}
                  </Link>
                ))}

                <ScrollBar
                  orientation="horizontal"
                  className="mt-1 h-1 w-full"
                />
              </ScrollArea>
            </p>

            {showAlbum && song.type !== "episode" && (
              <p className="w-full truncate">
                <Link
                  href={getHref(song.album_url, "album")}
                  className="group-hover:text-primary"
                >
                  {song.album}
                </Link>
              </p>
            )}

            {song.type === "episode" && (
              <p className="w-full text-end">
                {new Date(song.release_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          <div className="flex w-[10%] items-center justify-between text-end">
            <LikeButton className="hover:text-primary" />

            <span className="truncate">
              {formatDuration(song.duration, "mm:ss")}
            </span>

            <SongTileDropDown />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SongList;
