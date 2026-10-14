import type { Episode, Song } from "@infinitunes/types";

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
        {items.map((item, i) => (
          <li
            key={`${item.id}-${i}`}
            className="[contain-intrinsic-size:auto_var(--row)] [content-visibility:auto]"
          >
            <SongListRow
              item={item}
              index={i}
              showAlbum={showAlbum}
              user={user}
              favorites={favorites}
              playlists={playlists}
              playlistId={playlistId}
              playlistSongIndex={playlistSongIndices?.[i]}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
