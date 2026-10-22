import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createClient(url: string) {
  // Keep one connection per serverless instance; use a pooler for production.
  const client = postgres(url, { max: 1 });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createClient>;
