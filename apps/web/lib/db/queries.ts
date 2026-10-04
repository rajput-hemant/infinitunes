"use server";

import { updateTag } from "next/cache";

import { withActionCode } from "~/lib/error-code";
import { api } from "~/lib/trpc/server";

export async function getUserPlaylists() {
  return withActionCode(() => api.user.getUserPlaylists());
}

export async function getPlaylistDetails(playlistId: string) {
  return withActionCode(() => api.user.getPlaylistDetails({ playlistId }));
}

export async function addSongsToPlaylist(playlistId: string, songs: string[]) {
  return withActionCode(async () => {
    const playlist = await api.user.addSongsToPlaylist({ playlistId, songs });
    updateTag("user_playlists");
    return playlist;
  });
}

export async function removeSongsFromPlaylist(
  playlistId: string,
  index: number,
  songId: string,
) {
  return withActionCode(async () => {
    const playlist = await api.user.removeSongsFromPlaylist({
      playlistId,
      index,
      songId,
    });
    updateTag("user_playlists");
    return playlist;
  });
}

export async function getUserFavorites() {
  return withActionCode(() => api.user.getUserFavorites());
}

export async function addToFavorites(
  token: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
) {
  return withActionCode(async () => {
    const favorites = await api.user.addToFavorites({ token, type });
    updateTag("user_favorites");
    return favorites;
  });
}

export async function removeFromFavorites(
  token: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
) {
  return withActionCode(async () => {
    const favorites = await api.user.removeFromFavorites({ token, type });
    updateTag("user_favorites");
    return favorites;
  });
}
