import { authEnv } from "@infinitunes/auth/env";
import { dbEnv } from "@infinitunes/db/env";
import { clientSchema } from "@infinitunes/env/schema";
import { trpcEnv } from "@infinitunes/trpc/env";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { hasRateLimitCredentials } from "./rate-limit-env";

export const env = createEnv({
  extends: [authEnv(), dbEnv(), trpcEnv()],
  server: {
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    ENABLE_RATE_LIMITING: z.enum(["true", "false"]).default("false"),
    TRUSTED_PROXY: z.enum(["vercel", "true", "false"]).optional(),
    RATE_LIMITING_REQUESTS_PER_SECOND: z.coerce.number().default(50),
    UMAMI_WEBSITE_ID: z.string().optional(),
  },
  client: clientSchema,
  createFinalSchema: (shape) =>
    z.object(shape).refine(hasRateLimitCredentials, {
      error:
        "ENABLE_RATE_LIMITING=true requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
      path: ["UPSTASH_REDIS_REST_URL"],
    }),
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
