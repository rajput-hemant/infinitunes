import { MenuView } from "@expo/ui/community/menu";
import { router } from "expo-router";
import type { ReactNode } from "react";

import { confirmDeletePlaylist } from "./confirm-delete-playlist";

type PlaylistMenuProps = {
  playlist: { id: string; name: string };
  /** Runs when a delete is confirmed (leave the playlist's own screen). */
  onDeleting?: () => void;
  /** The trigger; tapping it opens the native menu. */
  children: ReactNode;
};

/** Rename and delete for one of the listener's playlists, in the platform menu. */
export function PlaylistMenu({
  playlist,
  onDeleting,
  children,
}: PlaylistMenuProps) {
  return (
    <MenuView
      title={playlist.name}
      actions={[
        { id: "rename", title: "Rename", image: "pencil" },
        {
          id: "delete",
          title: "Delete Playlist",
          image: "trash",
          attributes: { destructive: true },
        },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === "rename") {
          router.push({
            pathname: "/me/edit-playlist/[id]",
            params: { id: playlist.id },
          });
        } else if (nativeEvent.event === "delete") {
          confirmDeletePlaylist(playlist, onDeleting);
        }
      }}
    >
      {children}
    </MenuView>
  );
}
