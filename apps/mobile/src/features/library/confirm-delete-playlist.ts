import { Alert } from "react-native";

import { deletePlaylist } from "~/user-data/playlists";

/**
 * Asks before deleting (it cannot be undone). `onDeleting` runs when the
 * listener confirms, before the optimistic delete, e.g. to leave the
 * playlist's own screen.
 */
export function confirmDeletePlaylist(
  playlist: { id: string; name: string },
  onDeleting?: () => void,
) {
  Alert.alert(
    "Delete this playlist?",
    `"${playlist.name}" will be removed permanently. This cannot be undone.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          onDeleting?.();
          deletePlaylist(playlist.id);
        },
      },
    ],
  );
}
