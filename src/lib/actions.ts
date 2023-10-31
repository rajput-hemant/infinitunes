"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { users } from "./db/schema";

type Credentials = {
  email: string;
  password: string;
};

export async function createNewAccount({ email, password }: Credentials) {
  try {
    const hashedPassword = await hash(password, 10);

    // check if email already exists
    // const [user] = await db
    //   .select()
    //   .from(users)
    //   .where(eq(users.email, email))
    //   .limit(1);

    // if (user) {
    //   return { error: "Email already exists" };
    // }

    await db.insert(users).values({ email, password: hashedPassword });
  } catch (error) {
    throw new Error((error as Error).message);
  }

  redirect("/");
}

export async function resetPassword({ email, password }: Credentials) {
  try {
    const hashedPassword = await hash(password, 10);

    const updatedPass = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, email))
      .returning({ updatedPass: users.password });

    if (updatedPass.length === 0) {
      throw new Error("Email not found, please try signing up");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }

  redirect("/login");
}
