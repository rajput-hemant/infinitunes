"use server";

import { redirect } from "next/navigation";
import { hash } from "bcryptjs";

import { db } from "./db";
import { users } from "./db/schema";

export async function createNewAccount({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
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
