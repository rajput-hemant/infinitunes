import { resetPasswordSchema } from "@infinitunes/auth/schemas";
import {
  betterAuthAccounts,
  favorites,
  myPlaylists,
  users,
} from "@infinitunes/db/schema";
import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { count, eq as drizzleEq, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../trpc";

const playlistInput = z.object({
  playlistId: z.string(),
});

const playlistSongsInput = z.object({
  playlistId: z.string(),
  songs: z.array(z.string()),
});

const favoriteInput = z.object({
  token: z.string(),
  type: z.enum(["song", "album", "playlist", "artist", "show"]),
});

const newPlaylistInput = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(100, { message: "Name must be at most 100 characters long" }),
  description: z
    .string()
    .max(255, { message: "Description must be at most 255 characters long" })
    .optional(),
});

const updateUserInput = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  email: z.string().optional(),
});

export const userRouter = router({
  getUserPlaylists: protectedProcedure.input(z.object({})).query(({ ctx }) =>
    ctx.db.query.myPlaylists.findMany({
      where: (playlistRow, { eq: equals }) =>
        equals(playlistRow.userId, ctx.session.user.id),
    }),
  ),

  getPlaylistDetails: protectedProcedure
    .input(playlistInput)
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.myPlaylists.findFirst({
        where: (playlistRow, { eq: equals }) =>
          equals(playlistRow.id, input.playlistId),
      });

      return playlist?.userId === ctx.session.user.id ? playlist : undefined;
    }),

  addSongsToPlaylist: protectedProcedure
    .input(playlistSongsInput)
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.myPlaylists.findFirst({
        where: (playlistRow, { eq: equals }) =>
          equals(playlistRow.id, input.playlistId),
      });

      if (!playlist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playlist not found",
        });
      }

      if (playlist.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      const dedupSongs = [
        ...new Set([...input.songs, ...playlist.songs]),
      ].slice(0, 100);

      const [updatedPlaylist] = await ctx.db
        .update(myPlaylists)
        .set({ songs: dedupSongs })
        .where(drizzleEq(myPlaylists.id, input.playlistId))
        .returning();

      return updatedPlaylist;
    }),

  getUserFavorites: protectedProcedure.input(z.object({})).query(({ ctx }) =>
    ctx.db.query.favorites.findFirst({
      where: (favoriteRow, { eq: equals }) =>
        equals(favoriteRow.userId, ctx.session.user.id),
    }),
  ),

  addToFavorites: protectedProcedure
    .input(favoriteInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userFavorites = await ctx.db.query.favorites.findFirst({
        where: (favoriteRow, { eq: equals }) =>
          equals(favoriteRow.userId, userId),
      });

      if (!userFavorites) {
        return ctx.db
          .insert(favorites)
          .values({
            userId,
            songs: input.type === "song" ? [input.token] : [],
            albums: input.type === "album" ? [input.token] : [],
            playlists: input.type === "playlist" ? [input.token] : [],
            artists: input.type === "artist" ? [input.token] : [],
            podcasts: input.type === "show" ? [input.token] : [],
          })
          .returning();
      }

      return ctx.db
        .update(favorites)
        .set({
          songs:
            input.type === "song"
              ? sql`array_append(songs, ${input.token})`
              : undefined,
          albums:
            input.type === "album"
              ? sql`array_append(albums, ${input.token})`
              : undefined,
          playlists:
            input.type === "playlist"
              ? sql`array_append(playlists, ${input.token})`
              : undefined,
          artists:
            input.type === "artist"
              ? sql`array_append(artists, ${input.token})`
              : undefined,
          podcasts:
            input.type === "show"
              ? sql`array_append(podcasts, ${input.token})`
              : undefined,
        })
        .where(drizzleEq(favorites.userId, userId))
        .returning();
    }),

  removeFromFavorites: protectedProcedure
    .input(favoriteInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userFavorites = await ctx.db.query.favorites.findFirst({
        where: (favoriteRow, { eq: equals }) =>
          equals(favoriteRow.userId, userId),
      });

      if (!userFavorites) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Favorites not found",
        });
      }

      return ctx.db
        .update(favorites)
        .set({
          songs:
            input.type === "song"
              ? sql`array_remove(songs, ${input.token})`
              : undefined,
          albums:
            input.type === "album"
              ? sql`array_remove(albums, ${input.token})`
              : undefined,
          playlists:
            input.type === "playlist"
              ? sql`array_remove(playlists, ${input.token})`
              : undefined,
          artists:
            input.type === "artist"
              ? sql`array_remove(artists, ${input.token})`
              : undefined,
          podcasts:
            input.type === "show"
              ? sql`array_remove(podcasts, ${input.token})`
              : undefined,
        })
        .where(drizzleEq(favorites.userId, userId))
        .returning();
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const userRecord = await ctx.db.query.users.findFirst({
        where: (userRow, { eq: equals }) => equals(userRow.email, input.email),
      });

      if (!userRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found, please try signing up",
        });
      }

      if (!userRecord.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "User does not have a password, you might have signed up with a social account",
        });
      }

      const isPasswordValid = await compare(
        input.password,
        userRecord.password,
      );

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Previous password is incorrect, please try again",
        });
      }

      const hashedPassword = await hash(input.newPassword, 10);

      await ctx.db
        .update(users)
        .set({ password: hashedPassword })
        .where(drizzleEq(users.email, input.email));

      await ctx.db
        .update(betterAuthAccounts)
        .set({ password: hashedPassword })
        .where(drizzleEq(betterAuthAccounts.userId, userRecord.id));
    }),

  createNewPlaylist: protectedProcedure
    .input(newPlaylistInput)
    .mutation(async ({ ctx, input }) => {
      const [{ playlistsCount }] = await ctx.db
        .select({ playlistsCount: count() })
        .from(myPlaylists)
        .where(drizzleEq(myPlaylists.userId, ctx.session.user.id));

      if (playlistsCount >= 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only have 10 playlists, please delete one",
        });
      }

      const [playlist] = await ctx.db
        .insert(myPlaylists)
        .values({
          name: input.name,
          description: input.description,
          userId: ctx.session.user.id,
        })
        .returning();

      if (!playlist) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create playlist, please try again",
        });
      }

      return playlist;
    }),

  updateUser: protectedProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.username) {
        const usernameExists = await ctx.db.query.users.findFirst({
          where: (userRow, { eq: equals }) =>
            equals(userRow.username, input.username!),
        });

        if (usernameExists && usernameExists.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username already exists, please try another one",
          });
        }
      }

      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.betterAuthName = input.name;
      if (input.username !== undefined) patch.username = input.username;
      if (input.email !== undefined) patch.email = input.email;
      if (Object.keys(patch).length > 0) {
        await ctx.db
          .update(users)
          .set(patch)
          .where(drizzleEq(users.id, userId));
      }

      return ctx.db.query.users.findFirst({
        where: drizzleEq(users.id, userId),
      });
    }),

  deleteUser: protectedProcedure
    .input(z.object({}))
    .mutation(async ({ ctx }) => {
      const [deletedUser] = await ctx.db
        .delete(users)
        .where(drizzleEq(users.id, ctx.session.user.id))
        .returning();

      if (!deletedUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user, please try again",
        });
      }

      return deletedUser;
    }),
});
