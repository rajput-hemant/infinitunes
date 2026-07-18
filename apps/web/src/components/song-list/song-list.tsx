import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import type { Favorite, MyPlaylist } from "@/lib/db/schema";
import type { Episode, Song } from "@/types";

import { getUser } from "@/lib/auth";
import { getUserFavorites, getUserPlaylists } from "@/lib/db/queries";
import { cn, formatDuration, getHref, getImageSrc } from "@/lib/utils";
import { DownloadButton } from "../download-button";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { TileMoreButton } from "./more-button";
import { TilePlayPauseButton } from "./play-pause-button";

type SongListProps = {
  items: (Song | Episode)[];
  showAlbum?: boolean;
  className?: string;
};

export async function SongList(props: SongListProps) {
  const { items, showAlbum = true, className } = props;

  const user = await getUser();

  let playlists: MyPlaylist[] | undefined, favorites: Favorite | undefined;

  if (user) {
    [playlists, favorites] = await Promise.all([
      getUserPlaylists(user.id),
      getUserFavorites(user.id),
    ]);
  }

  return (
    <section className={className}>
      <ol className="space-y-2 text-muted-foreground">
        {items.map((item, i) => (
          <li key={item.id}>
            <div className="group flex h-14 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-sm">
              <div className="hidden w-[6%] lg:flex lg:justify-center xl:w-[4%]">
                <span
                  className={cn(
                    "truncate font-medium",
                    !showAlbum && "group-hover:hidden"
                  )}
                >
                  {i + 1}
                </span>

                {!showAlbum && (
                  <PlayButton
                    type={item.type}
                    token={item.url.split("/").pop()!}
                    className="group/play hidden aspect-square h-8 shrink-0 items-center justify-center rounded-full border border-muted-foreground duration-300 hover:h-9 hover:border-primary hover:text-primary group-hover:flex"
                  >
                    <Play
                      strokeWidth={9}
                      className="h-full w-5 p-1 duration-300 group-hover/play:w-6"
                    />
                  </PlayButton>
                )}
              </div>

              <figure className="flex items-center justify-between gap-4 overflow-hidden lg:w-[86%]">
                {showAlbum && (
                  <div className="relative aspect-square h-10 min-w-fit overflow-hidden rounded">
                    <Image
                      src={getImageSrc(item.image, "low")}
                      alt={item.name}
                      fill
                      className="z-10 object-cover duration-300 group-hover:brightness-50"
                    />

                    <Skeleton className="absolute inset-0 rounded" />

                    <TilePlayPauseButton
                      id={item.id}
                      type={item.type}
                      token={item.url.split("/").pop()!}
                    />
                  </div>
                )}

                <figcaption
                  className={cn(
                    "flex w-full flex-col lg:w-[calc(100%-0.5rem)] lg:flex-row",
                    showAlbum && "xl:w-2/3"
                  )}
                >
                  <h4 className="w-full truncate font-semibold">
                    <Link
                      href={getHref(
                        item.url,
                        item.type === "song" ? "song" : "episode"
                      )}
                      className="text-primary group-hover:text-primary lg:text-muted-foreground"
                    >
                      {item.name}
                    </Link>
                  </h4>

                  <ScrollArea className="w-full truncate pb-1">
                    {item.artist_map.primary_artists.map((artist, i, arr) => (
                      <Link
                        key={artist.id}
                        href={getHref(artist.url, "artist")}
                        className="hover:text-foreground"
                      >
                        {artist.name}
                        {i !== arr.length - 1 && ", "}
                      </Link>
                    ))}

                    <ScrollBar
                      orientation="horizontal"
                      className="mt-1 h-1 w-full"
                    />
                  </ScrollArea>
                </figcaption>

                {showAlbum && item.type !== "episode" && (
                  <p className="hidden w-1/3 truncate xl:block">
                    <Link
                      href={getHref(item.album_url, "album")}
                      className="hover:text-primary"
                    >
                      {item.album}
                    </Link>
                  </p>
                )}

                {item.type === "episode" && (
                  <p className="hidden w-full pr-8 text-end lg:block">
                    {new Date(item.release_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </figure>

              <div className="flex w-[12%] items-center justify-end gap-3 lg:w-[16%] lg:shrink-0 lg:justify-between xl:w-[12%] 2xl:w-[10%]">
                <DownloadButton songs={[item]} />

                <LikeButton
                  user={user}
                  type={item.type}
                  token={item.id}
                  name={item.name}
                  favourites={favorites}
                  className="hidden hover:text-primary lg:block"
                />

                <span className="hidden shrink-0 truncate lg:block">
                  {formatDuration(item.duration, "mm:ss")}
                </span>

                <TileMoreButton
                  user={user}
                  item={item}
                  showAlbum={showAlbum}
                  playlists={playlists}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
