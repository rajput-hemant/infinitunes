import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export function createClient(url: string) {
  const client = postgres(url, { max: 1 });
  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createClient>;
