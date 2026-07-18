import { createClient } from "./client";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("'DATABASE_URL' is not set in the environment variables");
}

export const db = createClient(url);
