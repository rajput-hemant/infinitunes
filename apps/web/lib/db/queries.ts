"use server";

import { updateTag } from "next/cache";

import { api } from "~/lib/trpc/server";

export function getUserPlaylists() {
  return api.user.getUserPlaylists({});
}

export function getPlaylistDetails(playlistId: string) {
  return api.user.getPlaylistDetails({ playlistId });
}

export async function addSongsToPlaylist(playlistId: string, songs: string[]) {
  const playlist = await api.user.addSongsToPlaylist({ playlistId, songs });
  updateTag("user_playlists");
  return playlist;
}

export function getUserFavorites() {
  return api.user.getUserFavorites({});
}

export async function addToFavorites(
  token: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
) {
  const favorites = await api.user.addToFavorites({ token, type });
  updateTag("user_favorites");
  return favorites;
}

export async function removeFromFavorites(
  token: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
) {
  const favorites = await api.user.removeFromFavorites({ token, type });
  updateTag("user_favorites");
  return favorites;
}
