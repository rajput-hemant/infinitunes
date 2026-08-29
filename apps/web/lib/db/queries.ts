"use server";

import { db } from "@infinitunes/db";
import { favorites, myPlaylists } from "@infinitunes/db/schema";
import { eq, sql } from "drizzle-orm";
import { updateTag, unstable_cache } from "next/cache";
import { cache } from "react";

import { getUser } from "~/lib/auth";

const getUserPlaylistsCached = cache(
  unstable_cache(
    async (userId: string) => {
      const playlists = await db.query.myPlaylists.findMany({
        where: (playlist, { eq }) => eq(playlist.userId, userId),
      });

      return playlists;
    },
    ["user_playlists"],
    { tags: ["user_playlists"] },
  ),
);

export async function getUserPlaylists(userId: string) {
  return getUserPlaylistsCached(userId);
}

export async function getPlaylistDetails(playlistId: string) {
  const playlist = await db.query.myPlaylists.findFirst({
    where: (playlist, { eq }) => eq(playlist.id, playlistId),
  });

  return playlist;
}

export async function addSongsToPlaylist(playlistId: string, songs: string[]) {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const playlist = await getPlaylistDetails(playlistId);

  if (!playlist) {
    throw new Error("Playlist not found");
  }

  if (playlist.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  const dedupSongs = [...new Set([...songs, ...playlist.songs])].slice(0, 100);

  const [updatedPlaylist] = await db
    .update(myPlaylists)
    .set({ songs: dedupSongs })
    .where(eq(myPlaylists.id, playlistId))
    .returning();

  updateTag("user_playlists");

  return updatedPlaylist;
}

const getUserFavoritesCached = cache(
  unstable_cache(
    async (userId: string) => {
      const favorites = await db.query.favorites.findFirst({
        where: (favorites, { eq }) => eq(favorites.userId, userId),
      });

      return favorites;
    },
    ["user_favorites"],
    { tags: ["user_favorites"] },
  ),
);

export async function getUserFavorites(userId: string) {
  return getUserFavoritesCached(userId);
}

export async function addToFavorites(
  token: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
) {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = user.id;

  const userFavorites = await getUserFavorites(userId);

  if (!userFavorites) {
    const newFavorites = await db
      .insert(favorites)
      .values({
        userId,
        songs: type === "song" ? [token] : [],
        albums: type === "album" ? [token] : [],
        playlists: type === "playlist" ? [token] : [],
        artists: type === "artist" ? [token] : [],
        podcasts: type === "show" ? [token] : [],
      })
      .returning();

    if (!newFavorites) {
      throw new Error("Failed to add to favorites");
    }

    updateTag("user_favorites");

    return newFavorites;
  }

  const updatedfavorites = await db
    .update(favorites)
    .set({
      songs: type === "song" ? sql`array_append(songs, ${token})` : undefined,
      albums:
        type === "album" ? sql`array_append(albums, ${token})` : undefined,
      playlists:
        type === "playlist"
          ? sql`array_append(playlists, ${token})`
          : undefined,
      artists:
        type === "artist" ? sql`array_append(artists, ${token})` : undefined,
      podcasts:
        type === "show" ? sql`array_append(podcasts, ${token})` : undefined,
    })
    .where(eq(favorites.userId, userId))
    .returning();

  if (!updatedfavorites) {
    throw new Error("Failed to add to favorites");
  }

  updateTag("user_favorites");

  return updatedfavorites;
}

export async function removeFromFavorites(
  token: string,
  type: "song" | "album" | "playlist" | "artist" | "show",
) {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = user.id;

  const userFavorites = await getUserFavorites(userId);

  if (!userFavorites) {
    throw new Error("Favorites not found");
  }

  const updatedfavorites = await db
    .update(favorites)
    .set({
      songs: type === "song" ? sql`array_remove(songs, ${token})` : undefined,
      albums:
        type === "album" ? sql`array_remove(albums, ${token})` : undefined,
      playlists:
        type === "playlist"
          ? sql`array_remove(playlists, ${token})`
          : undefined,
      artists:
        type === "artist" ? sql`array_remove(artists, ${token})` : undefined,
      podcasts:
        type === "show" ? sql`array_remove(podcasts, ${token})` : undefined,
    })
    .where(eq(favorites.userId, userId))
    .returning();

  if (!updatedfavorites) {
    throw new Error("Failed to remove from favorites");
  }

  updateTag("user_favorites");

  return updatedfavorites;
}
