import { createServerEnv } from "@infinitunes/env/server";
import { loadEnvConfig } from "@next/env";

// Load root `.env` so `bun dev` from the monorepo root picks up env vars.
loadEnvConfig(process.cwd());

export const env = createServerEnv({
  context: {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL === "1",
    vercelUrl: process.env.VERCEL_URL,
  },
});
