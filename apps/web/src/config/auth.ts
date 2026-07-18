import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import type { NextAuthConfig } from "next-auth";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/validations";

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const user = validatedFields.data;

          const dbUser = await db.query.users.findFirst({
            where: (u, { eq }) =>
              user.type === "email" ?
                eq(u.email, user.email!)
              : eq(u.username, user.username!),
          });

          if (dbUser && dbUser.password) {
            const isValid = await compare(user.password, dbUser.password);

            if (isValid) {
              return dbUser;
            }
          }
        }

        return null;
      },
    }),
  ],
};
