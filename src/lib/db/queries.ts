"use server";

import { db } from ".";

export async function getUserPlaylists(userId: string) {
  const playlists = await db.query.myPlaylists.findMany({
    where: (playlist, { eq }) => eq(playlist.userId, userId),
  });

  return playlists;
}
