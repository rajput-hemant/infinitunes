import { changePasswordSchema, emailSchema } from "@infinitunes/auth/schemas";
import {
  betterAuthAccounts,
  betterAuthSessions,
  favorites,
  myPlaylists,
  users,
} from "@infinitunes/db/schema";
import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { and, count, eq, ne, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";
import { z } from "zod";

import type { Session, TRPCContext } from "../trpc";
import { protectedProcedure, router } from "../trpc";

export const PLAYLIST_MAX_SONGS = 5000;

/**
 * Accounts without a password (passkey/OAuth only) confirm destructive actions
 * with a recently created session instead of a password.
 */
export const FRESH_SESSION_MS = 10 * 60 * 1000;

const playlistInput = z.object({
  playlistId: z.string(),
});

const playlistSongsInput = z.object({
  playlistId: z.string(),
  songs: z.array(z.string().max(64)).max(500),
});

const favoriteInput = z.object({
  token: z.string().max(64),
  type: z.enum(["song", "album", "playlist", "artist", "show"]),
});

type FavoriteType = z.infer<typeof favoriteInput>["type"];

function emptyFavoriteLists(type: FavoriteType, token: string) {
  return {
    songs: type === "song" ? [token] : [],
    albums: type === "album" ? [token] : [],
    playlists: type === "playlist" ? [token] : [],
    artists: type === "artist" ? [token] : [],
    podcasts: type === "show" ? [token] : [],
  };
}

function favoritePatch(
  type: FavoriteType,
  token: string,
  op: "append" | "remove",
) {
  const patch = (column: SQLWrapper) =>
    op === "append"
      ? sql`case when ${token} = any(${column}) then ${column} else array_append(${column}, ${token}) end`
      : sql`array_remove(${column}, ${token})`;

  return {
    songs: type === "song" ? patch(favorites.songs) : undefined,
    albums: type === "album" ? patch(favorites.albums) : undefined,
    playlists: type === "playlist" ? patch(favorites.playlists) : undefined,
    artists: type === "artist" ? patch(favorites.artists) : undefined,
    podcasts: type === "show" ? patch(favorites.podcasts) : undefined,
  };
}

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

const renamePlaylistInput = newPlaylistInput.extend({
  playlistId: z.string(),
});

const removeSongsFromPlaylistInput = z.object({
  playlistId: z.string(),
  index: z.number().int().min(0),
  songId: z.string(),
});

export function removeSongAtPlaylistIndex(
  songs: string[],
  index: number,
  songId: string,
) {
  if (index < 0 || index >= songs.length || songs[index] !== songId) {
    return null;
  }
  const next = [...songs];
  next.splice(index, 1);
  return next;
}

const updateUserInput = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: emailSchema.transform((email) => email.toLowerCase()).optional(),
  /** Required (and verified) only when the email actually changes. */
  currentPassword: z.string().max(200).optional(),
});

/** Required for accounts that have a password; passwordless accounts omit it. */
const deleteUserInput = z.object({
  password: z.string().min(1).max(200).optional(),
});

const WRONG_PASSWORD_MESSAGE = "Current password is incorrect";
const NO_PASSWORD_MESSAGE =
  "This account has no password (it signs in with a passkey or OAuth). Use Forgot password on the login page to set one";
const REAUTH_MESSAGE = "Please sign in again to continue";
const PASSWORD_REQUIRED_MESSAGE = "Enter your current password to continue";

async function loadCredentials(db: TRPCContext["db"], userId: string) {
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!userRecord) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const credentialAccount = await db.query.betterAuthAccounts.findFirst({
    where: and(
      eq(betterAuthAccounts.userId, userId),
      eq(betterAuthAccounts.providerId, "credential"),
    ),
  });

  return {
    userRecord,
    credentialAccount,
    storedHash: credentialAccount?.password ?? userRecord.password,
  };
}

async function assertPasswordMatches(storedHash: string, password: string) {
  if (!(await compare(password, storedHash))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: WRONG_PASSWORD_MESSAGE,
    });
  }
}

/**
 * Verifies the signed-in user's password server-side against the credential
 * account hash (falling back to the legacy `user.password`). Throws
 * BAD_REQUEST when the account has no password or the password is wrong.
 */
async function verifyCurrentPassword(
  db: TRPCContext["db"],
  userId: string,
  password: string,
) {
  const credentials = await loadCredentials(db, userId);
  if (!credentials.storedHash) {
    throw new TRPCError({ code: "BAD_REQUEST", message: NO_PASSWORD_MESSAGE });
  }
  await assertPasswordMatches(credentials.storedHash, password);

  return credentials;
}

/**
 * Confirms the caller before a sensitive action: the current password for
 * accounts that have one, otherwise a session created within
 * `FRESH_SESSION_MS` (an unknown creation time counts as stale).
 */
async function confirmIdentity(
  ctx: { db: TRPCContext["db"]; session: NonNullable<Session> },
  password: string | undefined,
) {
  const { storedHash } = await loadCredentials(ctx.db, ctx.session.user.id);

  if (storedHash) {
    if (!password) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: PASSWORD_REQUIRED_MESSAGE,
      });
    }
    await assertPasswordMatches(storedHash, password);
    return;
  }

  const createdAt = ctx.session.session?.createdAt;
  if (
    !createdAt ||
    Date.now() - new Date(createdAt).getTime() > FRESH_SESSION_MS
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message: REAUTH_MESSAGE });
  }
}

async function storePassword(
  db: TRPCContext["db"],
  userRecord: { id: string; email: string },
  credentialAccount: { id: string } | undefined,
  newPassword: string,
) {
  const hashedPassword = await hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, userRecord.email));

  if (credentialAccount) {
    await db
      .update(betterAuthAccounts)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(betterAuthAccounts.id, credentialAccount.id));
  } else {
    await db.insert(betterAuthAccounts).values({
      userId: userRecord.id,
      accountId: userRecord.id,
      providerId: "credential",
      password: hashedPassword,
    });
  }
}

function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error ? error.cause : undefined;
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    cause.code === "23505"
  );
}

async function getOwnedPlaylist(
  ctx: { db: TRPCContext["db"]; session: NonNullable<Session> },
  playlistId: string,
) {
  const playlist = await ctx.db.query.myPlaylists.findFirst({
    where: eq(myPlaylists.id, playlistId),
  });

  if (!playlist) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
  }

  if (playlist.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
  }

  return playlist;
}

export const userRouter = router({
  getUserPlaylists: protectedProcedure.query(({ ctx }) =>
    ctx.db.query.myPlaylists.findMany({
      where: eq(myPlaylists.userId, ctx.session.user.id),
    }),
  ),

  getPlaylistDetails: protectedProcedure
    .input(playlistInput)
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.myPlaylists.findFirst({
        where: eq(myPlaylists.id, input.playlistId),
      });

      return playlist?.userId === ctx.session.user.id ? playlist : undefined;
    }),

  addSongsToPlaylist: protectedProcedure
    .input(playlistSongsInput)
    .mutation(async ({ ctx, input }) => {
      const playlist = await getOwnedPlaylist(ctx, input.playlistId);

      const merged = [...new Set([...playlist.songs, ...input.songs])];

      if (merged.length > PLAYLIST_MAX_SONGS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Playlist is full (5,000 songs)",
        });
      }

      const [updatedPlaylist] = await ctx.db
        .update(myPlaylists)
        .set({ songs: merged })
        .where(
          and(
            eq(myPlaylists.id, input.playlistId),
            eq(myPlaylists.userId, ctx.session.user.id),
          ),
        )
        .returning();

      return updatedPlaylist;
    }),

  removeSongsFromPlaylist: protectedProcedure
    .input(removeSongsFromPlaylistInput)
    .mutation(async ({ ctx, input }) => {
      const playlist = await getOwnedPlaylist(ctx, input.playlistId);

      const songs = removeSongAtPlaylistIndex(
        playlist.songs,
        input.index,
        input.songId,
      );

      if (!songs) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Song not found in playlist at that position",
        });
      }

      const [updatedPlaylist] = await ctx.db
        .update(myPlaylists)
        .set({ songs })
        .where(
          and(
            eq(myPlaylists.id, input.playlistId),
            eq(myPlaylists.userId, ctx.session.user.id),
          ),
        )
        .returning();

      return updatedPlaylist;
    }),

  renamePlaylist: protectedProcedure
    .input(renamePlaylistInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedPlaylist(ctx, input.playlistId);

      const [updatedPlaylist] = await ctx.db
        .update(myPlaylists)
        .set({
          name: input.name,
          description: input.description,
        })
        .where(
          and(
            eq(myPlaylists.id, input.playlistId),
            eq(myPlaylists.userId, ctx.session.user.id),
          ),
        )
        .returning();

      return updatedPlaylist;
    }),

  deletePlaylist: protectedProcedure
    .input(playlistInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedPlaylist(ctx, input.playlistId);

      const [deletedPlaylist] = await ctx.db
        .delete(myPlaylists)
        .where(
          and(
            eq(myPlaylists.id, input.playlistId),
            eq(myPlaylists.userId, ctx.session.user.id),
          ),
        )
        .returning();

      return deletedPlaylist;
    }),

  getUserFavorites: protectedProcedure.query(({ ctx }) =>
    ctx.db.query.favorites.findFirst({
      where: eq(favorites.userId, ctx.session.user.id),
    }),
  ),

  addToFavorites: protectedProcedure
    .input(favoriteInput)
    .mutation(({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db
        .insert(favorites)
        .values({
          userId,
          ...emptyFavoriteLists(input.type, input.token),
        })
        .onConflictDoUpdate({
          target: favorites.userId,
          set: favoritePatch(input.type, input.token, "append"),
        })
        .returning();
    }),

  removeFromFavorites: protectedProcedure
    .input(favoriteInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const rows = await ctx.db
        .update(favorites)
        .set(favoritePatch(input.type, input.token, "remove"))
        .where(eq(favorites.userId, userId))
        .returning();

      if (rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Favorites not found",
        });
      }

      return rows;
    }),

  /** Signed-in password change. The account comes from the session. */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { userRecord, credentialAccount } = await verifyCurrentPassword(
        ctx.db,
        userId,
        input.password,
      );

      await storePassword(
        ctx.db,
        userRecord,
        credentialAccount,
        input.newPassword,
      );

      // Revoke every other session (stolen or forgotten devices) but keep the
      // caller's. Deleted straight from the session table: Better Auth's
      // revokeOtherSessions endpoint needs the request headers, which tRPC
      // procedures do not receive.
      const currentToken = ctx.session.session?.token;
      await ctx.db
        .delete(betterAuthSessions)
        .where(
          currentToken
            ? and(
                eq(betterAuthSessions.userId, userId),
                ne(betterAuthSessions.token, currentToken),
              )
            : eq(betterAuthSessions.userId, userId),
        );
    }),

  createNewPlaylist: protectedProcedure
    .input(newPlaylistInput)
    .mutation(async ({ ctx, input }) => {
      const [{ playlistsCount }] = await ctx.db
        .select({ playlistsCount: count() })
        .from(myPlaylists)
        .where(eq(myPlaylists.userId, ctx.session.user.id));

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

      return playlist;
    }),

  updateUser: protectedProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const patch: {
        betterAuthName?: string;
        email?: string;
        emailVerifiedBoolean?: boolean;
        emailVerified?: null;
      } = {};
      if (input.name !== undefined) patch.betterAuthName = input.name;
      if (input.email !== undefined) {
        const current = await ctx.db.query.users.findFirst({
          columns: { email: true },
          where: eq(users.id, userId),
        });
        if (current?.email !== input.email) {
          await confirmIdentity(ctx, input.currentPassword);
          patch.email = input.email;
          patch.emailVerifiedBoolean = false;
          patch.emailVerified = null;
        }
      }
      if (Object.keys(patch).length > 0) {
        try {
          await ctx.db.update(users).set(patch).where(eq(users.id, userId));
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "That email is already in use",
            });
          }
          throw error;
        }
      }

      return ctx.db.query.users.findFirst({
        columns: { password: false },
        where: eq(users.id, userId),
      });
    }),

  deleteUser: protectedProcedure
    .input(deleteUserInput)
    .mutation(async ({ ctx, input }) => {
      await confirmIdentity(ctx, input.password);

      const [deletedUser] = await ctx.db
        .delete(users)
        .where(eq(users.id, ctx.session.user.id))
        .returning({ id: users.id });

      return deletedUser;
    }),
});
