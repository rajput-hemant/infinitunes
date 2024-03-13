"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import type { resetPasswordSchema, signUpSchema } from "./validations";
import type { z } from "zod";

import { db } from "./db";
import { users } from "./db/schema";

export async function createNewAccount(
  credentials: z.infer<typeof signUpSchema>
) {
  const { email, password } = credentials;

  const hashedPassword = await hash(password, 10);

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (user) {
    throw new Error("Email already exists, please try logging in");
  }

  await db
    .insert(users)
    .values({ username: randomUUID(), email, password: hashedPassword });

  redirect("/");
}

export async function resetPassword(
  credentials: z.infer<typeof resetPasswordSchema>
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
      "User does not have a password, you might have signed up with a social account"
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

  redirect("/login");
}
