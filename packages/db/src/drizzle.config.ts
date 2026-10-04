import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

// drizzle-kit runs from packages/db, so it never sees the repo-root env files.
for (const name of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(
      fileURLToPath(new URL(`../../../${name}`, import.meta.url)),
    );
  } catch {}
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: { url: process.env.DATABASE_URL! },
  tablesFilter: ["infinitunes_*"],
});
