import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { SongRowItem } from "@infinitunes/types";

import type { User } from "~/lib/auth";
import { cn } from "~/lib/utils";

import { SongListHead } from "./song-list-head";
import { SongListRow } from "./song-list-row";

type SongListProps = {
  user?: User;
  items: SongRowItem[];
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
              favorites={userFavorites}
              playlists={userPlaylists}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
