import { changePasswordSchema, emailSchema } from "@infinitunes/auth/schemas";
import { newPlaylistSchema } from "@infinitunes/core/validations";
import {
  betterAuthAccounts,
  betterAuthSessions,
  favorites,
  infinitunesPasskeys,
  myPlaylists,
  recentlyPlayed,
  users,
} from "@infinitunes/db/schema";
import { USER_NAME_MAX } from "@infinitunes/types";
import { TRPCError } from "@trpc/server";
import { compare, hash } from "bcryptjs";
import { and, count, eq, ne, sql } from "drizzle-orm";
import type { SQLWrapper } from "drizzle-orm";
import { z } from "zod";

import type { Session, TRPCContext } from "../trpc";
import { protectedProcedure, router } from "../trpc";

export const PLAYLIST_MAX_SONGS = 5000;
const FAVORITE_MAX_ITEMS = 5000;

/** Playlists one account may own. */
export const PLAYLIST_MAX_COUNT = 10;

/** Advisory-lock namespace that serializes one user's playlist creates. */
const myPlaylistsLockKey = "infinitunes_playlist.create";

/**
 * Accounts without a password (passkey/OAuth only) confirm destructive actions
 * with a recently created session instead of a password.
 */
export const FRESH_SESSION_MS = 10 * 60 * 1000;

/** Playlist ids are database uuids: anything else is a bad request, not a 500. */
const playlistIdSchema = z.uuid({ error: "That playlist doesn't exist" });

const playlistInput = z.object({
  playlistId: playlistIdSchema,
});

const playlistSongsInput = z.object({
  playlistId: playlistIdSchema,
  songs: z.array(z.string().max(64)).max(PLAYLIST_MAX_SONGS),
});

const favoriteInput = z.object({
  token: z.string().min(1).max(64),
  type: z.enum(["song", "album", "playlist", "artist", "show"]),
});

const addFavoriteInput = favoriteInput.extend({
  /** A show's perma token, kept beside its id so reading it back is one `show.details` call. */
  linkToken: z
    .string()
    .regex(/^[\w,-]{1,64}$/)
    .optional(),
});

type FavoriteType = z.infer<typeof favoriteInput>["type"];

const favoriteColumns = {
  song: "songs",
  album: "albums",
  playlist: "playlists",
  artist: "artists",
  show: "podcasts",
} as const;

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
  linkToken?: string,
) {
  const patch = (column: SQLWrapper) =>
    op === "append"
      ? sql`case when ${token} = any(${column}) then ${column} when cardinality(${column}) < ${FAVORITE_MAX_ITEMS} then array_append(${column}, ${token}) else ${column} end`
      : sql`array_remove(${column}, ${token})`;

  return {
    songs: type === "song" ? patch(favorites.songs) : undefined,
    albums: type === "album" ? patch(favorites.albums) : undefined,
    playlists: type === "playlist" ? patch(favorites.playlists) : undefined,
    artists: type === "artist" ? patch(favorites.artists) : undefined,
    podcasts: type === "show" ? patch(favorites.podcasts) : undefined,
    podcastTokens:
      type !== "show"
        ? undefined
        : op === "remove"
          ? sql`${favorites.podcastTokens} - ${token}`
          : linkToken
            ? sql`case when ${token} = any(${favorites.podcasts}) or cardinality(${favorites.podcasts}) < ${FAVORITE_MAX_ITEMS} then ${favorites.podcastTokens} || ${JSON.stringify({ [token]: linkToken })}::jsonb else ${favorites.podcastTokens} end`
            : undefined,
  };
}

const renamePlaylistInput = newPlaylistSchema.extend({
  playlistId: playlistIdSchema,
});

const removeSongsFromPlaylistInput = z.object({
  playlistId: playlistIdSchema,
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

const movePlaylistSongInput = z.object({
  playlistId: playlistIdSchema,
  from: z.number().int().min(0),
  to: z.number().int().min(0),
  songId: z.string(),
});

/**
 * The songs with the one at `from` moved to `to`, or `null` when `from`
 * does not hold `songId` (a stale view: the client re-reads and retries) or
 * `to` is past the end.
 */
export function moveSongInPlaylist(
  songs: string[],
  from: number,
  to: number,
  songId: string,
) {
  if (songs[from] !== songId || to >= songs.length) return null;
  const next = [...songs];
  next.splice(from, 1);
  next.splice(to, 0, songId);
  return next;
}

/**
 * Strict so a stale client still sending `email` gets an error instead of a
 * silently dropped change: the email moves through `requestEmailChange`.
 */
const updateUserInput = z.strictObject({
  name: z.string().trim().min(1).max(USER_NAME_MAX).optional(),
});

const requestEmailChangeInput = z.object({
  email: emailSchema.transform((email) => email.toLowerCase()),
  /** Required for accounts that have a password (else a fresh session). */
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
  const credentialAccount = await db.query.betterAuthAccounts.findFirst({
    columns: { id: true, password: true },
    where: and(
      eq(betterAuthAccounts.userId, userId),
      eq(betterAuthAccounts.providerId, "credential"),
    ),
  });

  return {
    credentialAccount,
    storedHash: credentialAccount?.password,
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
 * account hash. Throws
 * BAD_REQUEST when the account has no password or the password is wrong.
 */
async function verifyCurrentPassword(
  db: TRPCContext["db"],
  userId: string,
  password: string,
) {
  const credentials = await loadCredentials(db, userId);
  if (!credentials.credentialAccount || !credentials.storedHash) {
    throw new TRPCError({ code: "BAD_REQUEST", message: NO_PASSWORD_MESSAGE });
  }
  await assertPasswordMatches(credentials.storedHash, password);

  return credentials.credentialAccount;
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

type PlaylistCtx = { db: TRPCContext["db"]; session: NonNullable<Session> };

/** NOT_FOUND for a missing playlist, FORBIDDEN for someone else's. */
function assertOwnedPlaylist<T extends { userId: string }>(
  playlist: T | undefined,
  userId: string,
): T {
  if (!playlist) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Playlist not found" });
  }

  if (playlist.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
  }

  return playlist;
}

async function getOwnedPlaylist(ctx: PlaylistCtx, playlistId: string) {
  const playlist = await ctx.db.query.myPlaylists.findFirst({
    columns: { userId: true },
    where: eq(myPlaylists.id, playlistId),
  });

  return assertOwnedPlaylist(playlist, ctx.session.user.id);
}

/**
 * Rewrites a playlist's song list from the list as stored. The row is read
 * `FOR UPDATE` inside a transaction, so two writes to one playlist (an add on
 * the phone while the web reorders it) apply one after the other instead of
 * the later one overwriting the earlier with a stale list. `change` returns
 * the new list, or throws to leave the playlist as it is.
 */
async function updateOwnedPlaylistSongs(
  ctx: PlaylistCtx,
  playlistId: string,
  change: (songs: string[]) => string[],
) {
  return ctx.db.transaction(async (tx) => {
    const [row] = await tx
      .select({ userId: myPlaylists.userId, songs: myPlaylists.songs })
      .from(myPlaylists)
      .where(eq(myPlaylists.id, playlistId))
      .for("update");
    const playlist = assertOwnedPlaylist(row, ctx.session.user.id);

    const [updatedPlaylist] = await tx
      .update(myPlaylists)
      .set({ songs: change(playlist.songs) })
      .where(
        and(
          eq(myPlaylists.id, playlistId),
          eq(myPlaylists.userId, ctx.session.user.id),
        ),
      )
      .returning();

    return updatedPlaylist;
  });
}

/** The client's index no longer holds the song it meant (a stale view). */
function staleSongPosition(): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Song not found in playlist at that position",
  });
}

export const userRouter = router({
  getUserPlaylists: protectedProcedure.query(({ ctx }) =>
    ctx.db.query.myPlaylists.findMany({
      // A summary: the count and the first four ids (covers), never the whole
      // song list, which only `getPlaylistDetails` returns.
      columns: { id: true, name: true, description: true, createdAt: true },
      extras: {
        songCount: sql<number>`cardinality(${myPlaylists.songs})`.as(
          "song_count",
        ),
        coverSongs: sql<string[]>`${myPlaylists.songs}[1:4]`.as("cover_songs"),
      },
      where: eq(myPlaylists.userId, ctx.session.user.id),
    }),
  ),

  /**
   * Every playlist's song ids in one query, for "Add to Playlist" check marks
   * (mobile menus); the library list itself stays a summary.
   */
  getPlaylistMembership: protectedProcedure.query(({ ctx }) =>
    ctx.db.query.myPlaylists.findMany({
      columns: { id: true, songs: true },
      where: eq(myPlaylists.userId, ctx.session.user.id),
    }),
  ),

  getPlaylistDetails: protectedProcedure
    .input(playlistInput)
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.myPlaylists.findFirst({
        where: and(
          eq(myPlaylists.id, input.playlistId),
          eq(myPlaylists.userId, ctx.session.user.id),
        ),
      });

      // TanStack Query rejects `undefined` data: a missing playlist is `null`.
      return playlist ?? null;
    }),

  addSongsToPlaylist: protectedProcedure
    .input(playlistSongsInput)
    .mutation(({ ctx, input }) =>
      updateOwnedPlaylistSongs(ctx, input.playlistId, (current) => {
        const merged = [...new Set([...current, ...input.songs])];

        if (merged.length > PLAYLIST_MAX_SONGS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Playlist is full (5,000 songs)",
          });
        }

        return merged;
      }),
    ),

  removeSongsFromPlaylist: protectedProcedure
    .input(removeSongsFromPlaylistInput)
    .mutation(({ ctx, input }) =>
      updateOwnedPlaylistSongs(
        ctx,
        input.playlistId,
        (current) =>
          removeSongAtPlaylistIndex(current, input.index, input.songId) ??
          staleSongPosition(),
      ),
    ),

  movePlaylistSong: protectedProcedure
    .input(movePlaylistSongInput)
    .mutation(({ ctx, input }) =>
      updateOwnedPlaylistSongs(
        ctx,
        input.playlistId,
        (current) =>
          moveSongInPlaylist(current, input.from, input.to, input.songId) ??
          staleSongPosition(),
      ),
    ),

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

  getUserFavorites: protectedProcedure.query(
    async ({ ctx }) =>
      (await ctx.db.query.favorites.findFirst({
        where: eq(favorites.userId, ctx.session.user.id),
      })) ?? null,
  ),

  addToFavorites: protectedProcedure
    .input(addFavoriteInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const rows = await ctx.db
        .insert(favorites)
        .values({
          userId,
          ...emptyFavoriteLists(input.type, input.token),
          podcastTokens:
            input.type === "show" && input.linkToken
              ? { [input.token]: input.linkToken }
              : {},
        })
        .onConflictDoUpdate({
          target: favorites.userId,
          set: favoritePatch(
            input.type,
            input.token,
            "append",
            input.linkToken,
          ),
        })
        .returning();

      const lists = rows[0];
      if (!lists || !lists[favoriteColumns[input.type]].includes(input.token)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Favorites list is full (5,000 items)",
        });
      }
      return rows;
    }),

  removeFromFavorites: protectedProcedure
    .input(favoriteInput)
    // No favorites row yet means nothing to remove: `[]`, so an unlike is
    // idempotent instead of a NOT_FOUND that rolls the heart back.
    .mutation(({ ctx, input }) =>
      ctx.db
        .update(favorites)
        .set(favoritePatch(input.type, input.token, "remove"))
        .where(eq(favorites.userId, ctx.session.user.id))
        .returning(),
    ),

  /** Signed-in password change. The account comes from the session. */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const credentialAccount = await verifyCurrentPassword(
        ctx.db,
        userId,
        input.password,
      );

      const hashedPassword = await hash(input.newPassword, 10);

      // Revoke every other session (stolen or forgotten devices) but keep the
      // caller's. Deleted straight from the session table: Better Auth's
      // revokeOtherSessions endpoint needs the request headers, which tRPC
      // procedures do not receive.
      const currentToken = ctx.session.session?.token;
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(betterAuthAccounts)
          .set({ password: hashedPassword, updatedAt: new Date() })
          .where(eq(betterAuthAccounts.id, credentialAccount.id));

        await tx
          .delete(betterAuthSessions)
          .where(
            currentToken
              ? and(
                  eq(betterAuthSessions.userId, userId),
                  ne(betterAuthSessions.token, currentToken),
                )
              : eq(betterAuthSessions.userId, userId),
          );
      });
    }),

  createNewPlaylist: protectedProcedure
    .input(newPlaylistSchema)
    .mutation(({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        const userId = ctx.session.user.id;
        // Count and insert under a per-user lock (released at commit), or
        // parallel creates (a double tap, phone and web) all count below the
        // cap and all insert.
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`${myPlaylistsLockKey}:${userId}`}, 0))`,
        );

        const [{ playlistsCount }] = await tx
          .select({ playlistsCount: count() })
          .from(myPlaylists)
          .where(eq(myPlaylists.userId, userId));

        if (playlistsCount >= PLAYLIST_MAX_COUNT) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You can only have ${PLAYLIST_MAX_COUNT} playlists, please delete one`,
          });
        }

        const [playlist] = await tx
          .insert(myPlaylists)
          .values({
            name: input.name,
            description: input.description,
            userId,
          })
          .returning();

        return playlist;
      }),
    ),

  updateUser: protectedProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (input.name !== undefined) {
        await ctx.db
          .update(users)
          .set({ betterAuthName: input.name })
          .where(eq(users.id, userId));
      }

      return ctx.db.query.users.findFirst({
        columns: {
          id: true,
          email: true,
          image: true,
          betterAuthName: true,
          emailVerifiedBoolean: true,
          createdAt: true,
          updatedAt: true,
        },
        where: eq(users.id, userId),
      });
    }),

  /**
   * Starts an email change (X-1). Nothing is written here: Better Auth mails a
   * link to the NEW address and swaps the email only when it is opened. The
   * answer is the same whether or not that address already has an account, so
   * the form cannot probe for registered emails.
   */
  requestEmailChange: protectedProcedure
    .input(requestEmailChangeInput)
    .mutation(async ({ ctx, input }) => {
      const current = await ctx.db.query.users.findFirst({
        columns: { email: true },
        where: eq(users.id, ctx.session.user.id),
      });
      if (current?.email === input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That is already your email",
        });
      }

      await confirmIdentity(ctx, input.currentPassword);

      if (!ctx.requestEmailChange) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Changing your email is not available right now",
        });
      }
      try {
        await ctx.requestEmailChange(input.email);
      } catch (error) {
        console.error(
          "[user] email change request failed:",
          error instanceof Error ? error.message : "unknown error",
        );
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "We couldn't start the email change. Try again later",
        });
      }

      return { pendingEmail: input.email };
    }),

  deleteUser: protectedProcedure
    .input(deleteUserInput)
    .mutation(async ({ ctx, input }) => {
      await confirmIdentity(ctx, input.password);

      const userId = ctx.session.user.id;
      await ctx.db.transaction(async (tx) => {
        await tx.delete(favorites).where(eq(favorites.userId, userId));
        await tx.delete(myPlaylists).where(eq(myPlaylists.userId, userId));
        await tx
          .delete(recentlyPlayed)
          .where(eq(recentlyPlayed.userId, userId));
        await tx
          .delete(infinitunesPasskeys)
          .where(eq(infinitunesPasskeys.userId, userId));
        // Shared sessions have no app marker; revocation also signs out Lipi.
        await tx
          .delete(betterAuthSessions)
          .where(eq(betterAuthSessions.userId, userId));
      });

      return { id: userId };
    }),
});
