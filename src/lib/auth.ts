import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getServerSession, type NextAuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { db } from "./db";
import { users } from "./db/schema";
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
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },

      authorize: async (credentials) => {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials?.email ?? ""))
          .limit(1);

        if (dbUser) {
          const isValid = await compare(
            credentials?.password ?? "",
            dbUser.password ?? ""
          );

          if (isValid) {
            return dbUser;
          }
        }

        return null;
      },
    }),
  ],

  callbacks: {
    // session: async ({ token, session }) => {
    //   if (token) {
    //     session.user.id = token.id;
    //     session.user.name = token.name;
    //     session.user.email = token.email;
    //     session.user.image = token.picture;
    //   }

    //   return session;
    // },

    session: ({ session, token }) => {
      if (token) {
        const { id, name, email, picture: image } = token;
        session.user = { id, name, email, image };
      }

      return session;
    },

    jwt: async ({ token, user }) => {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, token.email ?? ""))
        .limit(1);

      if (!dbUser) {
        if (user) {
          token.id = user.id;
        }

        return token;
      }

      const { id, name, email, image: picture } = dbUser;

      return { id, name, email, picture };
    },

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
