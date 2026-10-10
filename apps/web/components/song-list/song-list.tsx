import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Episode, Song } from "@infinitunes/types";
import {
  formatDuration,
  decode,
  formatReleaseDate,
  getImageSrc,
  parseToken,
} from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Play } from "lucide-react";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { cn, getHref } from "~/lib/utils";

import { DownloadButton } from "../download-button";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { ArtistLinks } from "./artist-links";
import { TileMoreButton } from "./more-button";
import { TilePlayPauseButton } from "./play-pause-button";

type SongListProps = {
  items: (Song | Episode)[];
  showAlbum?: boolean;
  className?: string;
  playlistId?: string;
  playlistSongIndices?: number[];
};

export async function SongList(props: SongListProps) {
  const {
    items,
    showAlbum = true,
    className,
    playlistId,
    playlistSongIndices,
  } = props;

  const user = await getUser();

  let playlists: MyPlaylist[] | undefined,
    favorites: Favorite | null | undefined;

  if (user) {
    [playlists, favorites] = await Promise.all([
      orFallback("user playlists", getUserPlaylists(), undefined),
      orFallback("user favorites", getUserFavorites(), null),
    ]);
  }

  return (
    <section className={className}>
      <ol className="flex flex-col gap-2 text-muted-foreground">
        {items.map((item, i) => (
          <li
            key={`${item.id}-${i}`}
            className="-m-2 p-2 [contain-intrinsic-size:auto_4.5rem] [content-visibility:auto]"
          >
            <div className="group flex h-14 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-xs">
              <div className="hidden w-[6%] lg:flex lg:justify-center xl:w-[4%]">
                <span
                  className={cn(
                    "truncate font-medium",
                    !showAlbum && "group-hover:hidden",
                  )}
                >
                  {i + 1}
                </span>

                {!showAlbum && (
                  <PlayButton
                    type={item.type}
                    token={parseToken(item.perma_url)}
                    className="group/play hidden aspect-square h-8 shrink-0 items-center justify-center rounded-full border border-muted-foreground transition-[transform,color,border-color] duration-150 ease-out hover:scale-110 hover:border-primary hover:text-primary group-hover:flex"
                  >
                    <Play
                      strokeWidth={9}
                      className="h-full w-5 p-1 transition-transform duration-150 ease-out group-hover/play:scale-110"
                    />
                  </PlayButton>
                )}
              </div>

              <figure className="flex items-center justify-between gap-4 overflow-hidden lg:w-[86%]">
                {showAlbum && (
                  <div className="relative aspect-square h-10 min-w-fit overflow-hidden rounded">
                    <ImageWithFallback
                      src={getImageSrc(item.image, "low")}
                      alt={decode(item.title)}
                      fill
                      sizes="40px"
                      fallback={getPlaceholderSrc("song")}
                      className="z-10 object-cover duration-300 group-hover:brightness-50"
                    />

                    <Skeleton className="absolute inset-0 rounded" />

                    <TilePlayPauseButton
                      id={item.id}
                      type={item.type}
                      token={parseToken(item.perma_url)}
                    />
                  </div>
                )}

                <figcaption
                  className={cn(
                    "flex min-w-0 w-full flex-col lg:w-[calc(100%-0.5rem)] lg:flex-row",
                    showAlbum && "xl:w-2/3",
                  )}
                >
                  <h3 className="w-full truncate font-semibold">
                    <Link
                      href={getHref(
                        item.perma_url,
                        item.type === "song" ? "song" : "episode",
                      )}
                      title={decode(item.title)}
                      className="text-primary group-hover:text-primary lg:text-muted-foreground"
                    >
                      {decode(item.title)}
                    </Link>
                  </h3>

                  <ArtistLinks
                    artists={item.more_info.artistMap?.primary_artists ?? []}
                  />
                </figcaption>

                {showAlbum && item.type !== "episode" && (
                  <p className="hidden w-1/3 truncate xl:block">
                    <Link
                      href={getHref(item.more_info.album_url, "album")}
                      className="hover:text-primary"
                    >
                      {decode(item.more_info.album)}
                    </Link>
                  </p>
                )}

                {item.type === "episode" && (
                  <p className="hidden w-full pr-8 text-end lg:block">
                    {formatReleaseDate(item.more_info.release_date)}
                  </p>
                )}
              </figure>

              <div className="flex shrink-0 items-center justify-end lg:w-[16%] lg:justify-between lg:gap-3 xl:w-[12%] 2xl:w-[10%]">
                <DownloadButton
                  songs={[item]}
                  className="size-11 hover:text-primary lg:size-5"
                />

                {/* Below lg the row menu carries Add/Remove Favourite. */}
                <LikeButton
                  user={user}
                  type={item.type}
                  token={item.id}
                  name={decode(item.title)}
                  favourites={favorites}
                  className="hidden hover:text-primary lg:block"
                />

                <span className="hidden shrink-0 truncate lg:block">
                  {formatDuration(item.more_info.duration, "mm:ss")}
                </span>

                <TileMoreButton
                  user={user}
                  favorites={favorites}
                  item={item}
                  showAlbum={showAlbum}
                  playlists={playlists}
                  playlistId={playlistId}
                  playlistSongIndex={playlistSongIndices?.[i]}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
