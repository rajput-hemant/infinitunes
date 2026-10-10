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
import { AudioLines, Play } from "lucide-react";
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
import {
  albumCellVisibility,
  artistCellVisibility,
  rowActionReveal,
  songRowGrid,
  subtitleVisibility,
} from "./row-grid";
import { SongRow } from "./song-row";

type SongListRowProps = {
  item: Song | Episode;
  index: number;
  showAlbum: boolean;
  user?: User;
  favorites?: Favorite | null;
  playlists?: MyPlaylist[];
  playlistId?: string;
  playlistSongIndex?: number;
};

const mutedCell = "min-w-0 text-[0.8125rem] text-muted-foreground";

export function SongListRow(props: SongListRowProps) {
  const {
    item,
    index,
    showAlbum,
    user,
    favorites,
    playlists,
    playlistId,
    playlistSongIndex,
  } = props;

  const artists = item.more_info.artistMap?.primary_artists ?? [];
  const isEpisode = item.type === "episode";
  const hoverHidesNumber = showAlbum
    ? ""
    : "group-hover/row:invisible group-focus-within/row:invisible";

  return (
    <SongRow
      id={item.id}
      className={cn(
        songRowGrid,
        "group/row relative h-row rounded-sm px-1 text-sm transition-colors duration-fast hover:bg-fill focus-within:bg-fill active:bg-fill-2 md:px-2",
      )}
    >
      <div
        className={cn(
          mutedCell,
          "relative hidden size-full place-items-center tabular-nums md:grid",
        )}
      >
        <span
          className={cn(
            "truncate group-data-current/row:hidden",
            hoverHidesNumber,
          )}
        >
          {index + 1}
        </span>

        <AudioLines
          aria-hidden="true"
          className={cn(
            "hidden size-4 text-primary group-data-current/row:block group-data-playing/row:animate-pulse",
            hoverHidesNumber,
          )}
        />

        {!showAlbum && (
          <PlayButton
            type={item.type}
            token={parseToken(item.perma_url)}
            className={cn(
              controlStyles.rowIcon,
              "absolute inset-0 m-auto grid place-items-center outline-hidden transition-colors duration-fast hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              rowActionReveal,
            )}
          >
            <Play aria-hidden="true" className="size-4 fill-current" />
          </PlayButton>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {showAlbum && (
          <div className="relative size-art shrink-0 overflow-hidden rounded-[calc(var(--r-sm)*0.75)]">
            <ImageWithFallback
              src={getImageSrc(item.image, "low")}
              alt={decode(item.title)}
              fill
              sizes="3rem"
              fallback={getPlaceholderSrc("song")}
              className="z-10 object-cover duration-base group-hover/row:brightness-50"
            />

            <Skeleton className="absolute inset-0 rounded-none" />

            <TilePlayPauseButton
              id={item.id}
              type={item.type}
              token={parseToken(item.perma_url)}
            />
          </div>
        )}

        <div className="grid min-w-0">
          <h3 className="truncate font-medium text-foreground">
            <Link
              href={getHref(item.perma_url, isEpisode ? "episode" : "song")}
              title={decode(item.title)}
              className="group-data-current/row:text-primary hover:underline"
            >
              {decode(item.title)}
            </Link>
          </h3>

          {isEpisode ? (
            <p
              className={cn(
                "truncate text-xs text-muted-foreground",
                subtitleVisibility,
              )}
            >
              {formatReleaseDate(item.more_info.release_date)}
            </p>
          ) : (
            <ArtistLinks
              artists={artists}
              className={cn(
                "pb-0 text-xs text-muted-foreground",
                subtitleVisibility,
              )}
            />
          )}
        </div>
      </div>

      <div className={cn(mutedCell, artistCellVisibility)}>
        <ArtistLinks artists={artists} className="pb-0" />
      </div>

      <div className={cn(mutedCell, albumCellVisibility, "truncate")}>
        {isEpisode ? (
          formatReleaseDate(item.more_info.release_date)
        ) : showAlbum ? (
          <Link
            href={getHref(item.more_info.album_url, "album")}
            className="hover:text-foreground hover:underline"
          >
            {decode(item.more_info.album)}
          </Link>
        ) : null}
      </div>

      <span className={cn(mutedCell, "hidden text-end tabular-nums md:block")}>
        {formatDuration(item.more_info.duration, "mm:ss")}
      </span>

      <div className="flex shrink-0 items-center justify-end gap-1 text-muted-foreground">
        <DownloadButton
          songs={[item]}
          className={cn("hover:text-foreground", rowActionReveal)}
        />

        {/* Below md the row menu carries Add/Remove Favourite. */}
        <LikeButton
          user={user}
          type={item.type}
          token={item.id}
          name={decode(item.title)}
          favourites={favorites}
          className={cn(
            "hidden hover:text-foreground aria-pressed:opacity-100 md:inline-flex",
            rowActionReveal,
          )}
        />

        <TileMoreButton
          user={user}
          favorites={favorites}
          item={item}
          showAlbum={showAlbum}
          playlists={playlists}
          playlistId={playlistId}
          playlistSongIndex={playlistSongIndex}
        />
      </div>
    </SongRow>
  );
}
