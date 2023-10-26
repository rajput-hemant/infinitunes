import { type Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  out: "./drizzle",
  tablesFilter: ["infinitunes_*"],
} satisfies Config;
