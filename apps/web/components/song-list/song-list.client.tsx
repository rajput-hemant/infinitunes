import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Episode, Song } from "@infinitunes/types";
import {
  decode,
  formatDuration,
  formatReleaseDate,
  getImageSrc,
  parseToken,
} from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { Play } from "lucide-react";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { cn, getHref } from "~/lib/utils";

import { DownloadButton } from "../download-button";
import { LikeButton } from "../like-button";
import { PlayButton } from "../play-button";
import { ArtistLinks } from "./artist-links";
import { TileMoreButton } from "./more-button";
import { TilePlayPauseButton } from "./play-pause-button";

type SongListProps = {
  user?: User;
  items: (Song | Episode)[];
  showAlbum?: boolean;
  userFavorites?: Favorite | null;
  userPlaylists?: MyPlaylist[];
  className?: string;
};

export function SongListClient(props: SongListProps) {
  const {
    user,
    items,
    showAlbum = true,
    userFavorites,
    userPlaylists,
    className,
  } = props;

  return (
    <section className={className}>
      <ol className="flex flex-col gap-2 text-muted-foreground">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="-m-2 p-2 [contain-intrinsic-size:auto_4.5rem] [content-visibility:auto]"
          >
            <div className="group flex h-14 w-full cursor-pointer items-center justify-between overflow-hidden rounded-md px-2 text-sm transition-shadow duration-150 hover:shadow-md lg:border lg:pl-0 lg:pr-4 lg:shadow-xs">
              <div className="relative hidden min-w-11 shrink-0 items-center lg:flex lg:justify-center">
                <span
                  className={cn(
                    "truncate font-medium",
                    !showAlbum &&
                      "group-hover:invisible group-focus-within:invisible",
                  )}
                >
                  {i + 1}
                </span>

                {!showAlbum && (
                  <PlayButton
                    type={item.type}
                    token={parseToken(item.perma_url)}
                    className={cn(
                      controlStyles.rowIcon,
                      "group/play absolute flex shrink-0 items-center justify-center rounded-full border border-muted-foreground opacity-0 outline-hidden transition-[transform,color,border-color] duration-150 ease-out hover:scale-110 hover:border-primary hover:text-primary group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    )}
                  >
                    <Play
                      strokeWidth={9}
                      className="size-5 transition-transform duration-150 ease-out group-hover/play:scale-110"
                    />
                  </PlayButton>
                )}
              </div>

              <figure className="flex items-center justify-between gap-4 min-w-0 flex-1 overflow-hidden">
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

              <div className="flex shrink-0 items-center justify-end lg:justify-between lg:gap-1">
                <DownloadButton songs={[item]} className="hover:text-primary" />

                {/* Below lg the row menu carries Add/Remove Favourite. */}
                <LikeButton
                  user={user}
                  type={item.type}
                  token={item.id}
                  name={decode(item.title)}
                  favourites={userFavorites}
                  className="hidden hover:text-primary lg:inline-flex"
                />

                <span className="hidden w-12 shrink-0 text-center tabular-nums lg:block">
                  {formatDuration(item.more_info.duration, "mm:ss")}
                </span>

                <TileMoreButton
                  user={user}
                  favorites={userFavorites}
                  item={item}
                  showAlbum={showAlbum}
                  playlists={userPlaylists}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
