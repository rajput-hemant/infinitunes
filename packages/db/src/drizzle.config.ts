import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  verbose: true,
  dbCredentials: { url: process.env.DATABASE_URL! },
  tablesFilter: ["infinitunes_*"],
});
