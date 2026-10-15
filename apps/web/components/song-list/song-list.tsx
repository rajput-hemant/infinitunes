import type { Episode, Song } from "@infinitunes/types";

import { PlaylistRow } from "~/components/playlist/playlist-overlay";
import { cn } from "~/lib/utils";
import { getViewer } from "~/lib/viewer";

import { SongListHead } from "./song-list-head";
import { SongListRow } from "./song-list-row";

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

  const { user, playlists, favorites } = await getViewer();

  return (
    <section className={cn("@container", className)}>
      <SongListHead showAlbum={showAlbum} />

      <ol className="flex flex-col text-muted-foreground">
        {items.map((item, i) => {
          const rowClass =
            "[contain-intrinsic-size:auto_var(--row)] [content-visibility:auto]";
          const dbIndex = playlistSongIndices?.[i];
          const row = (
            <SongListRow
              item={item}
              index={i}
              showAlbum={showAlbum}
              user={user}
              favorites={favorites}
              playlists={playlists}
              playlistId={playlistId}
              playlistSongIndex={dbIndex}
            />
          );

          // Rows of a playlist page close up the moment a song is removed.
          return playlistId && dbIndex !== undefined ? (
            <PlaylistRow
              key={`${item.id}-${i}`}
              playlistId={playlistId}
              songId={item.id}
              className={rowClass}
            >
              {row}
            </PlaylistRow>
          ) : (
            <li key={`${item.id}-${i}`} className={rowClass}>
              {row}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
