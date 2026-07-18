import { pgTableCreator } from "drizzle-orm/pg-core";

import { siteConfig } from "@/config/site";

/**
 * Use to keep multiple projects schemas/tables in the same database.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `${siteConfig.name.toLowerCase().replace(/\s/g, "_")}_${name}`
);
