import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getServerSession, type NextAuthOptions, type User } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { db } from "./db";
import { env } from "./env.mjs";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    newUser: "/signup",
  },

  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    // session: ({ session, token }) => {
    //   if (token) {
    //     const { id, name, email, picture: image } = token;
    //     session.user = { id, name, email, image };
    //   }

    //   return session;
    // },

    redirect: () => "/",
  },
};

/**
 * Gets the current user from the server session
 *
 * @returns The current user
 */
export async function getUser(): Promise<User | undefined> {
  const session = await getServerSession(authOptions);
  return session?.user;
}
