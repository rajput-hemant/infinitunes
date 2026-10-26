"use server";

import type { changePasswordSchema } from "@infinitunes/auth/schemas";
import type { FavoriteType } from "@infinitunes/core/favorites";
import type { newPlaylistSchema } from "@infinitunes/core/validations";
import { refresh } from "next/cache";
import type { z } from "zod";

import { toResult } from "./action-result";
import { api } from "./trpc/server";

// The library is read per request (session cookie, no `"use cache"`), so a
// write has no cache entry to expire. `refresh()` re-renders the current route
// with fresh dynamic data in the action response, which is what keeps liked
// state and playlist lists current after a write.

/** Signed-in change; other sessions are revoked server-side. */
export async function changePassword(
  credentials: z.infer<typeof changePasswordSchema>,
) {
  return toResult(() => api.user.changePassword(credentials));
}

export async function createNewPlaylist(
  data: z.infer<typeof newPlaylistSchema>,
) {
  return toResult(async () => {
    const playlist = await api.user.createNewPlaylist(data);
    refresh();
    return playlist;
  });
}

export async function renamePlaylist(
  playlistId: string,
  data: z.infer<typeof newPlaylistSchema>,
) {
  return toResult(async () => {
    const playlist = await api.user.renamePlaylist({ playlistId, ...data });
    refresh();
    return playlist;
  });
}

export async function deletePlaylist(playlistId: string) {
  return toResult(async () => {
    const playlist = await api.user.deletePlaylist({ playlistId });
    refresh();
    return playlist;
  });
}

export async function updateUser(data: { name?: string }) {
  return toResult(async () => {
    const user = await api.user.updateUser(data);
    refresh();
    return user;
  });
}

/** Mails a confirmation link to the new address; nothing changes until it is opened. */
export async function requestEmailChange(data: {
  email: string;
  currentPassword?: string;
}) {
  return toResult(() => api.user.requestEmailChange(data));
}

/** `password` is omitted by accounts that have none (fresh-session check). */
export async function deleteUser(password?: string) {
  return toResult(() => api.user.deleteUser({ password }));
}

export async function addSongsToPlaylist(playlistId: string, songs: string[]) {
  return toResult(async () => {
    const playlist = await api.user.addSongsToPlaylist({ playlistId, songs });
    refresh();
    return playlist;
  });
}

export async function removeSongsFromPlaylist(
  playlistId: string,
  index: number,
  songId: string,
) {
  return toResult(async () => {
    const playlist = await api.user.removeSongsFromPlaylist({
      playlistId,
      index,
      songId,
    });
    refresh();
    return playlist;
  });
}

export async function addToFavorites(
  token: string,
  type: FavoriteType,
  linkToken?: string,
) {
  return toResult(async () => {
    const favorites = await api.user.addToFavorites({
      token,
      type,
      linkToken,
    });
    refresh();
    return favorites;
  });
}

export async function removeFromFavorites(token: string, type: FavoriteType) {
  return toResult(async () => {
    const favorites = await api.user.removeFromFavorites({ token, type });
    refresh();
    return favorites;
  });
}
