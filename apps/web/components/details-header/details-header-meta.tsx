import type { Album, Episode, Mix, Playlist, Song } from "@infinitunes/types";
import { decode, formatCount, formatDuration } from "@infinitunes/types";
import Link from "next/link";
import type { ReactNode } from "react";

import { asRoute, getHref } from "~/lib/utils";

import type { DetailsItem } from "./details-header-items";
import { getSongs, isLabel } from "./details-header-items";

const metaLink = "font-semibold text-foreground hover:underline";

/** "N Plays", or nothing when upstream has no play count. */
function playsLabel(count: number | string | undefined): string {
  return countLabel(count, "Plays");
}

/** "N Fans" / "N Listeners", or nothing when the count is missing or zero. */
function countLabel(count: number | string | undefined, label: string): string {
  return Number(count) > 0 ? `${formatCount(count)} ${label}` : "";
}

function joinMeta(parts: string[]): string {
  return parts.filter(Boolean).join(" · ");
}

function SongMeta({ song }: { song: Song }) {
  const artistMap = song.more_info.artistMap;

  return (
    <>
      <p>
        <Link
          href={getHref(song.more_info.album_url ?? "", "album")}
          className={metaLink}
        >
          {decode(song.more_info.album)}
        </Link>
        {" by "}
        {artistMap?.primary_artists?.map(({ id, name, perma_url }, i, arr) => (
          <Link
            key={id}
            href={getHref(perma_url, "artist")}
            className={metaLink}
          >
            {decode(name)}
            {i !== arr.length - 1 && ", "}
          </Link>
        ))}
      </p>

      <p>
        {joinMeta([
          playsLabel(song.play_count),
          formatDuration(song.more_info.duration, "mm:ss"),
          decode(song.language),
        ])}
      </p>

      <p className="hidden w-fit md:block">
        <Link
          href={asRoute(song.more_info.label_url ?? "#")}
          className="hover:text-foreground"
        >
          {decode(song.more_info.copyright_text)}
        </Link>
      </p>
    </>
  );
}

function EpisodeMeta({ episode }: { episode: Episode }) {
  return (
    <>
      <p>{decode(episode.subtitle)}</p>

      <p>
        {joinMeta([
          playsLabel(episode.play_count),
          formatDuration(episode.more_info.duration, "mm:ss"),
          decode(episode.language),
        ])}
      </p>
    </>
  );
}

function AlbumMeta({ album }: { album: Album }) {
  const artists = album.more_info.artistMap?.artists;
  const albumDuration = getSongs(album).reduce(
    (sum, song) => sum + (Number(song.more_info.duration) || 0),
    0,
  );

  return (
    <p>
      by{" "}
      {artists?.map(({ id, name, perma_url }, i, arr) => (
        <Link
          key={id}
          href={getHref(perma_url, "artist")}
          title={decode(name)}
          className={metaLink}
        >
          {decode(name)}
          {i !== arr.length - 1 && ","}
        </Link>
      ))}
      {" · "}
      {joinMeta([
        `${formatCount(album.more_info.song_count)} Songs`,
        playsLabel(album.play_count),
        formatDuration(albumDuration, "mm:ss"),
      ])}
    </p>
  );
}

function PlaylistMeta({ playlist }: { playlist: Playlist }) {
  return (
    <p className="capitalize">
      {decode(playlist.subtitle)}
      {" · "}
      {playlist.more_info.subtitle_desc
        .slice()
        .reverse()
        .map((s, i, arr) => s + (i !== arr.length - 1 ? " · " : ""))}
    </p>
  );
}

function MixMeta({ mix }: { mix: Mix }) {
  return (
    <p>
      {decode(mix.more_info.firstname)}
      {" · "}
      {decode(mix.more_info.lastname)}
      {" · "}
      {mix.list_count ?? 0} Songs
    </p>
  );
}

function metaLines(item: DetailsItem): ReactNode {
  if (isLabel(item)) return null;

  switch (item.type) {
    case "song":
      return <SongMeta song={item} />;
    case "episode":
      return <EpisodeMeta episode={item} />;
    case "album":
      return <AlbumMeta album={item} />;
    case "playlist":
      return <PlaylistMeta playlist={item} />;
    case "season":
      return <p>{countLabel(item.more_info.fan_count, "Fans")}</p>;
    case "artist":
      return <p>{countLabel(item.fan_count, "Listeners")}</p>;
    case "mix":
      return <MixMeta mix={item} />;
  }
}

type DetailsMetaProps = {
  item: DetailsItem;
};

export function DetailsMeta({ item }: DetailsMetaProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 break-words text-sm text-muted-foreground">
      {metaLines(item)}
    </div>
  );
}
