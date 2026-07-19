"use server";

import { randomUUID } from "crypto";

import { db } from "@infinitunes/db/db";
import { betterAuthAccounts } from "@infinitunes/db/schema";
import type { NewUser } from "@infinitunes/db/schema";
import { myPlaylists, users } from "@infinitunes/db/schema";
import { compare, hash } from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import type {
  newPlaylistSchema,
  resetPasswordSchema,
  signUpSchema,
} from "./validations";

export async function resetPassword(
  credentials: z.infer<typeof resetPasswordSchema>,
) {
  const { email, password, newPassword } = credentials;

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (!user) {
    throw new Error("User not found, please try signing up");
  }

  if (!user.password) {
    throw new Error(
      "User does not have a password, you might have signed up with a social account",
    );
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Previous password is incorrect, please try again");
  }

  const hashedPassword = await hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));

  await db
    .update(betterAuthAccounts)
    .set({ password: hashedPassword })
    .where(eq(betterAuthAccounts.userId, user.id));

  redirect("/login");
}

export async function createNewPlaylist(
  data: z.infer<typeof newPlaylistSchema> & { userId: string },
) {
  const [{ playlistsCount }] = await db
    .select({ playlistsCount: count() })
    .from(myPlaylists)
    .where(eq(myPlaylists.userId, data.userId));

  if (playlistsCount >= 10) {
    throw new Error("You can only have 10 playlists, please delete one");
  }

  const [playlist] = await db.insert(myPlaylists).values(data).returning();

  if (!playlist) {
    throw new Error("Failed to create playlist, please try again");
  }

  updateTag("user_playlists");

  return playlist;
}

export async function updateUser(
  data: NewUser & { name?: string; username?: string; email?: string },
) {
  const userId = data.id!;

  const usernameExists = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, data.username!),
  });

  if (usernameExists && usernameExists.id !== userId) {
    throw new Error("Username already exists, please try another one");
  }

  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.betterAuthName = data.name;
  if (data.username !== undefined) patch.username = data.username;
  if (data.email !== undefined) patch.email = data.email;
  if (Object.keys(patch).length > 0) {
    await db.update(users).set(patch).where(eq(users.id, userId));
  }

  return db.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function deleteUser(userId: string) {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning();

  if (!deletedUser) {
    throw new Error("Failed to delete user, please try again");
  }

  return deletedUser;
}
