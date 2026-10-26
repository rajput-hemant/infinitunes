import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";

import { ListRow } from "~/components/list-row";
import { MenuTrigger } from "~/components/menu-trigger";
import { SwipeableRow } from "~/components/swipeable-row";

import { confirmDeletePlaylist } from "./confirm-delete-playlist";
import { PlaylistMenu } from "./playlist-menu";

export function songCount(count: number): string {
  return count === 1 ? "1 song" : `${count} songs`;
}

/**
 * One of the listener's playlists. A playlist being created is a dimmed,
 * labelled row (not a disabled button) until the server has given it an id.
 */
export function PlaylistRow({
  playlist,
  cover,
}: {
  playlist: PlaylistView;
  /** The first song's artwork; the playlist icon stands in until it loads. */
  cover?: string;
}) {
  const row = (
    <ListRow
      leading={
        cover
          ? { artwork: cover }
          : { icon: { ios: "music.note.list", android: "queue_music" } }
      }
      title={playlist.name}
      subtitle={playlist.pending ? "Creating…" : songCount(playlist.songCount)}
      href={
        playlist.pending
          ? undefined
          : { pathname: "/me/playlist/[id]", params: { id: playlist.id } }
      }
      trailing={
        playlist.pending ? null : (
          <PlaylistMenu playlist={playlist}>
            <MenuTrigger label={`Options for ${playlist.name}`} />
          </PlaylistMenu>
        )
      }
    />
  );

  if (playlist.pending) return row;
  return (
    <SwipeableRow
      trailing={[
        {
          label: "Delete",
          icon: { ios: "trash", android: "delete" },
          tone: "red",
          onPress: () => confirmDeletePlaylist(playlist),
        },
      ]}
    >
      {row}
    </SwipeableRow>
  );
}
