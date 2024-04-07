import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { createTable } from "./table-creator";

/* -----------------------------------------------------------------------------------------------
 * Auth tables
 * NOTE: auth tables are common to mutiple projects, remember to remove `table filters` before
 * performing any operations
 * -----------------------------------------------------------------------------------------------*/

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

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

/* -----------------------------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------------------------*/

export type MyPlaylist = typeof myPlaylists.$inferSelect;
export type NewPlaylist = typeof myPlaylists.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
