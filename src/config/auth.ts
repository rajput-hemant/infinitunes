import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import type { NextAuthConfig } from "next-auth";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { authSchema } from "@/lib/validations";

const LoginSchema = authSchema.innerType().omit({ confirmPassword: true });

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
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const dbUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, email),
          });

          if (dbUser && dbUser.password) {
            const isValid = await compare(password, dbUser.password);

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
