import type { PlaylistView } from "@infinitunes/core/react/optimistic-playlists";
import { View } from "react-native";

import { Icon } from "~/components/ui/icon";

import { confirmDeletePlaylist } from "./confirm-delete-playlist";
import { LibraryRow } from "./library-row";
import { PlaylistMenu } from "./playlist-menu";
import { SwipeableRow } from "./swipeable-row";

function songCount(count: number): string {
  return count === 1 ? "1 song" : `${count} songs`;
}

/**
 * One of the listener's playlists. A playlist being created is dimmed and
 * cannot be opened until the server has given it an id.
 */
export function PlaylistRow({ playlist }: { playlist: PlaylistView }) {
  const row = (
    <LibraryRow
      icon={{ ios: "music.note.list", android: "queue_music" }}
      title={playlist.name}
      subtitle={
        playlist.pending ? "Creating…" : songCount(playlist.songs.length)
      }
      href={
        playlist.pending
          ? undefined
          : { pathname: "/me/playlist/[id]", params: { id: playlist.id } }
      }
      trailing={
        playlist.pending ? null : (
          <PlaylistMenu playlist={playlist}>
            <View
              accessibilityRole="button"
              accessibilityLabel={`Options for ${playlist.name}`}
              className="size-ctl items-center justify-center"
            >
              <Icon
                name={{ ios: "ellipsis", android: "more_vert" }}
                size={20}
              />
            </View>
          </PlaylistMenu>
        )
      }
    />
  );

  if (playlist.pending) return row;
  return (
    <SwipeableRow
      action={{
        label: "Delete",
        icon: { ios: "trash", android: "delete" },
        onPress: () => confirmDeletePlaylist(playlist),
      }}
    >
      {row}
    </SwipeableRow>
  );
}
