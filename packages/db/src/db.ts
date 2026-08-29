import { createServerEnv } from "@infinitunes/env/server";

import type { DbClient } from "./client";
import { createClient } from "./client";

let client: DbClient | undefined;

export function getDb(): DbClient {
  if (!client) {
    const env = createServerEnv({ skipValidation: true });
    const url = env.DATABASE_URL;

    if (!url) {
      throw new Error("'DATABASE_URL' is not set in the environment variables");
    }

    client = createClient(url);
  }

  return client;
}

// Proxy so that importing `db` never connects (or throws) at module evaluation
// time - Next.js imports this transitively while collecting page data at build.
// The first actual property access still throws when DATABASE_URL is missing.
export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has: (_target, prop) => prop in (getDb() as object),
});
