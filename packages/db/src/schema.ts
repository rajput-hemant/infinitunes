import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { createTable } from "./table-creator";

/* ---------------------------------------------------------------------------
 * Legacy Auth.js tables (preserved for rollback)
 * ------------------------------------------------------------------------- */

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  /* Better Auth core compatibility fields */
  betterAuthName: text("betterAuthName").notNull().default(""),
  emailVerifiedBoolean: boolean("emailVerifiedBoolean")
    .notNull()
    .default(false),
  displayUsername: text("displayUsername"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<"oauth" | "email" | "credentials">().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

/* ---------------------------------------------------------------------------
 * Better Auth tables (unambiguous names to coexist with legacy tables)
 * ------------------------------------------------------------------------- */

export const betterAuthAccounts = pgTable(
  "better_auth_account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
    scope: text("scope"),
    idToken: text("idToken"),
    password: text("password"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex(
      "better_auth_account_provider_account_unique",
    ).on(table.providerId, table.accountId),
  }),
);

export const betterAuthSessions = pgTable("better_auth_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const betterAuthVerifications = pgTable("better_auth_verification", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

/* ---------------------------------------------------------------------------
 * App tables
 * ------------------------------------------------------------------------- */

export const myPlaylists = createTable("playlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  songs: text("songs").array().default("{}").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const favorites = createTable("favorite", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  songs: text("songs").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  albums: text("albums").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  playlists: text("playlists").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  artists: text("artists").array().unique().default("{}").notNull(),
  // @ts-expect-error string is not assignable to type 'string[]'
  podcasts: text("podcasts").array().unique().default("{}").notNull(),
});

/* ---------------------------------------------------------------------------
 * Inferred types
 * ------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MyPlaylist = typeof myPlaylists.$inferSelect;
export type NewPlaylist = typeof myPlaylists.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export type BetterAuthAccount = typeof betterAuthAccounts.$inferSelect;
export type NewBetterAuthAccount = typeof betterAuthAccounts.$inferInsert;

export type BetterAuthSession = typeof betterAuthSessions.$inferSelect;
export type NewBetterAuthSession = typeof betterAuthSessions.$inferInsert;

export type BetterAuthVerification =
  typeof betterAuthVerifications.$inferSelect;
export type NewBetterAuthVerification =
  typeof betterAuthVerifications.$inferInsert;
