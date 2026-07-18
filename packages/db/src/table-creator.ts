import { pgTableCreator } from "drizzle-orm/pg-core";

const projectName = "infinitunes";

/**
 * Prefixed table creator for app-internal tables to avoid collisions
 * when multiple projects share the same database schema.
 */
export const createTable = pgTableCreator((name) => `${projectName}_${name}`);
