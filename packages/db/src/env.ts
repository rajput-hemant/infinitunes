import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function dbEnv(
  options: {
    runtimeEnv?: Record<string, string | undefined>;
    skipValidation?: boolean;
  } = {},
) {
  const runtimeEnv = options.runtimeEnv ?? process.env;
  return createEnv({
    server: {
      DATABASE_URL: z
        .string({ error: "DATABASE_URL is required" })
        .min(1, "DATABASE_URL is required"),
    },
    runtimeEnv,
    emptyStringAsUndefined: true,
    skipValidation:
      options.skipValidation ?? runtimeEnv.SKIP_ENV_VALIDATION === "true",
  });
}
