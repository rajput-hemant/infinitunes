"use server";

import type { resetPasswordSchema } from "@infinitunes/auth/schemas";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { api } from "./trpc/server";
import type { newPlaylistSchema } from "./validations";

export async function resetPassword(
  credentials: z.infer<typeof resetPasswordSchema>,
) {
  await api.user.resetPassword(credentials);
  redirect("/login");
}

export async function createNewPlaylist(
  data: z.infer<typeof newPlaylistSchema>,
) {
  const playlist = await api.user.createNewPlaylist(data);
  updateTag("user_playlists");
  return playlist;
}

export function updateUser(data: {
  name?: string;
  username?: string;
  email?: string;
}) {
  return api.user.updateUser(data);
}

export function deleteUser() {
  return api.user.deleteUser({});
}
