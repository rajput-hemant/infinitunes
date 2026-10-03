"use server";

import type { changePasswordSchema } from "@infinitunes/auth/schemas";
import { updateTag } from "next/cache";
import type { z } from "zod";

import { api } from "./trpc/server";
import type { newPlaylistSchema } from "./validations";

/** Signed-in change; other sessions are revoked server-side. */
export async function changePassword(
  credentials: z.infer<typeof changePasswordSchema>,
) {
  await api.user.changePassword(credentials);
}

export async function createNewPlaylist(
  data: z.infer<typeof newPlaylistSchema>,
) {
  const playlist = await api.user.createNewPlaylist(data);
  updateTag("user_playlists");
  return playlist;
}

export async function renamePlaylist(
  playlistId: string,
  data: z.infer<typeof newPlaylistSchema>,
) {
  const playlist = await api.user.renamePlaylist({ playlistId, ...data });
  updateTag("user_playlists");
  return playlist;
}

export async function deletePlaylist(playlistId: string) {
  const playlist = await api.user.deletePlaylist({ playlistId });
  updateTag("user_playlists");
  return playlist;
}

export async function updateUser(data: {
  name?: string;
  email?: string;
  currentPassword?: string;
}) {
  return api.user.updateUser(data);
}

/** `password` is omitted by accounts that have none (fresh-session check). */
export async function deleteUser(password?: string) {
  return api.user.deleteUser({ password });
}
