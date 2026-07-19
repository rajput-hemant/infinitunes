import { createServerEnv } from "@infinitunes/env/server";

import { createClient } from "./client";

const env = createServerEnv({ skipValidation: true });
const url = env.DATABASE_URL;

if (!url) {
  throw new Error("'DATABASE_URL' is not set in the environment variables");
}

export const db = createClient(url);
