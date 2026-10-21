import { router } from "expo-router";

import { promptSignIn } from "~/user-data/session";

/** The Create tab: the New Playlist sheet over the current tab, or why it needs an account. */
export function openCreatePlaylist(userId: string | undefined) {
  if (!userId) {
    promptSignIn("You need an account to make playlists.");
    return;
  }
  router.push("/create-playlist");
}
