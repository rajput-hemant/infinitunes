import { formatDuration, getImageSrc } from "@infinitunes/types";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { ListMusic } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImageCollage } from "~/components/image-collage";
import {
  LibraryEmpty,
  LibraryState,
  LibraryUnavailable,
} from "~/components/library/library-section";
import { PlayAllButton } from "~/components/library/play-all-button";
import { RetryButton } from "~/components/library/retry-button";
import { PlaylistManageMenu } from "~/components/playlist/playlist-manage-menu";
import { SongList } from "~/components/song-list/song-list";
import { getPlaylistDetails } from "~/lib/db/queries";
import { fetchSongsChunked } from "~/lib/liked-songs";
import { api } from "~/lib/trpc/server";

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
    notFound();
  }

  const { name, description, songs } = playlist;

  const songsDetails = await fetchSongsChunked(songs, (input) =>
    api.song.details(input),
  );

  const songById = new Map(songsDetails?.map((song) => [song.id, song]) ?? []);
  const playlistEntries = songs.flatMap((songId, dbIndex) => {
    const song = songById.get(songId);
    return song ? [{ song, dbIndex }] : [];
  });
  const playlistSongs = playlistEntries.map(({ song }) => song);
  const playlistSongIndices = playlistEntries.map(({ dbIndex }) => dbIndex);
  const unavailableCount = songs.length - playlistSongs.length;

  const imageSrcs = playlistSongs
    .slice(0, 4)
    .map((song) => getImageSrc(song.image, "medium"))
    .concat(playlistSongs.length === 0 ? ["/images/placeholder/song.jpg"] : []);

  return (
    <div className="space-y-4">
      <figure className="mb-10 flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-start lg:gap-10">
        <div className="relative aspect-square w-44 shrink-0 overflow-hidden rounded-md border p-1 shadow-md transition-shadow duration-300 hover:shadow-xl md:w-56 xl:w-64">
          <ImageCollage src={imageSrcs} />

          <Skeleton className="absolute inset-0 -z-10" />
        </div>

        <figcaption className="flex w-full flex-col items-center justify-center overflow-hidden font-medium lg:items-start lg:gap-2 lg:p-1">
          <div className="flex w-full max-w-full items-center justify-center gap-2 lg:justify-start">
            <h1
              title={name}
              className="flex min-w-0 items-center truncate text-center font-heading text-xl capitalize dark:drop-shadow-md text-foreground sm:text-2xl md:text-3xl lg:text-start"
            >
              {name}
            </h1>
            <PlaylistManageMenu
              playlist={{ id, name, description }}
              redirectOnDelete
              triggerClassName="shrink-0"
            />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{description}</p>
            <p>
              <span>{songs.length} Songs</span>
              {playlistSongs.length > 0 && (
                <span>
                  {" · "}
                  {formatDuration(
                    playlistSongs.reduce(
                      (acc, song) => acc + Number(song.more_info.duration),
                      0,
                    ),
                    "mm:ss",
                  )}
                </span>
              )}
            </p>
          </div>

          {playlistSongs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 lg:mt-6">
              <PlayAllButton items={playlistSongs}>Play</PlayAllButton>
            </div>
          )}
        </figcaption>
      </figure>

      {playlistSongs.length ? (
        <>
          {unavailableCount > 0 && (
            <output className="block text-sm text-muted-foreground">
              {unavailableCount} saved song{unavailableCount === 1 ? "" : "s"}{" "}
              couldn’t be loaded. Your saved songs are safe. Refresh to try
              again.
            </output>
          )}
          <SongList
            items={playlistSongs}
            playlistId={id}
            playlistSongIndices={playlistSongIndices}
          />

          <h3 className="py-6 text-center font-heading text-xl dark:drop-shadow-md text-foreground sm:text-2xl md:text-3xl">
            <em>Yay! You have seen it all</em>{" "}
            <span className="text-foreground">🤩</span>
          </h3>
        </>
      ) : songsDetails === undefined ? (
        <LibraryUnavailable what="playlist songs" />
      ) : songs.length > 0 ? (
        <LibraryState
          icon={ListMusic}
          title="No saved songs are available"
          description="Your playlist still contains its saved songs, but none are available from the music service right now."
        >
          <RetryButton />
        </LibraryState>
      ) : (
        <LibraryEmpty
          icon={ListMusic}
          title="Nothing to see here"
          description="Add songs to this playlist from any song’s menu and they will show up here."
        />
      )}
    </div>
  );
}
