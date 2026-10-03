"use server";

import type {
  changePasswordSchema,
  resetPasswordSchema,
} from "@infinitunes/auth/schemas";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { api } from "./trpc/server";
import type { newPlaylistSchema } from "./validations";

/** Signed-in change; other sessions are revoked server-side. */
export async function resetPassword(
  credentials: z.infer<typeof changePasswordSchema>,
) {
  await api.user.resetPassword(credentials);
}

/** Logged-out `/reset-password` page flow. */
export async function resetPasswordAnonymous(
  credentials: z.infer<typeof resetPasswordSchema>,
) {
  await api.user.resetPasswordAnonymous(credentials);
  redirect("/login");
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
  return await api.user.updateUser(data);
}

export async function deleteUser(password: string) {
  return await api.user.deleteUser({ password });
}
