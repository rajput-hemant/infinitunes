import type { Config } from "drizzle-kit";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env.mjs";

export default {
  schema: "./src/lib/db/schema",
  out: "./src/lib/db/migrations",
  driver: "pg",
  dbCredentials: { connectionString: env.DATABASE_URL },
  tablesFilter: [`${siteConfig.name.toLowerCase().replace(/\s/g, "_")}_*`],
} satisfies Config;
