"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from ".";
import { myPlaylists } from "./schema";

export const getUserPlaylists = unstable_cache(
  async (userId: string) => {
    const playlists = await db.query.myPlaylists.findMany({
      where: (playlist, { eq }) => eq(playlist.userId, userId),
    });

    return playlists;
  },
  ["user_playlists"],
  { tags: ["user_playlists"] }
);

export async function addSongsToPlaylist(playlistId: string, songs: string[]) {
  const playlist = await db.query.myPlaylists.findFirst({
    where: (playlist, { eq }) => eq(playlist.id, playlistId),
  });

  if (!playlist) {
    throw new Error("Playlist not found");
  }

  const dedupSongs = [...new Set([...songs, ...playlist.songs])].slice(0, 100);

  const [updatedPlaylist] = await db
    .update(myPlaylists)
    .set({ songs: dedupSongs })
    .where(eq(myPlaylists.id, playlistId))
    .returning();

  revalidateTag("user_playlists");

  return updatedPlaylist;
}

export async function getPlaylistDetails(playlistId: string) {
  const playlist = await db.query.myPlaylists.findFirst({
    where: (playlist, { eq }) => eq(playlist.id, playlistId),
  });

  return playlist;
}
