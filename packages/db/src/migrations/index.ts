/**
 * Migration metadata and entry-point for Drizzle migrator.
 *
 * The `migrationsFolder` path is relative to the consuming project's
 * working directory. A consumer that references this package should resolve
 * to `node_modules/@infinitunes/db/src/migrations` or use a bundler alias.
 */

export const migrationsFolder = new URL(".", import.meta.url).pathname;
