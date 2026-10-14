import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Episode, Song } from "@infinitunes/types";

import { getUser } from "~/lib/auth";
import { getUserFavorites, getUserPlaylists } from "~/lib/db/queries";
import { orFallback } from "~/lib/degrade";
import { cn } from "~/lib/utils";

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
