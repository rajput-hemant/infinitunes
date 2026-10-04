/**
 * Migration metadata and entry-point for Drizzle migrator.
 *
 * `migrationsFolder` is the absolute filesystem path of this directory,
 * resolved from this module's own URL, so it does not depend on the cwd.
 */

export const migrationsFolder = new URL(".", import.meta.url).pathname;
