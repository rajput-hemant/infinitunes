"use server";

import { unstable_cache } from "next/cache";
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
  const [playlist] = await db
    .update(myPlaylists)
    .set({ songs })
    .where(eq(myPlaylists.id, playlistId))
    .returning();

  if (!playlist) {
    throw new Error("Playlist not found");
  }

  return playlist;
}
