import {
  createPlaylistOptimistic,
  deletePlaylistOptimistic,
  renamePlaylistOptimistic,
} from "@infinitunes/core/react/optimistic-playlists";
import { userMessage } from "@infinitunes/core/user-message";
import { toast } from "sonner-native";

import { trpcClient } from "~/lib/trpc";

import { refreshPlaylists } from "./use-server-playlists";

export type PlaylistDetails = { name: string; description?: string };

/**
 * Each write shows in every list at once (the shared overlay) and rolls back
 * with a toast when it fails. Nothing here clears the overlay: it drops its
 * own records once the refreshed playlists agree.
 */

export function createPlaylist(details: PlaylistDetails) {
  createPlaylistOptimistic(details, () =>
    trpcClient.user.createNewPlaylist.mutate(details),
  )
    .then((playlist) => toast.success(`Playlist "${playlist.name}" created`))
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

export function renamePlaylist(id: string, details: PlaylistDetails) {
  renamePlaylistOptimistic(id, details, () =>
    trpcClient.user.renamePlaylist.mutate({ playlistId: id, ...details }),
  )
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}

export function deletePlaylist(id: string, name: string) {
  deletePlaylistOptimistic(id, () =>
    trpcClient.user.deletePlaylist.mutate({ playlistId: id }),
  )
    .then(() => toast.success(`Playlist "${name}" deleted`))
    .catch((error: unknown) => toast.error(userMessage(error)))
    .finally(() => void refreshPlaylists());
}
