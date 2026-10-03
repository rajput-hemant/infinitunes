import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function trpcEnv(
  options: {
    runtimeEnv?: Record<string, string | undefined>;
    skipValidation?: boolean;
  } = {},
) {
  const runtimeEnv = options.runtimeEnv ?? process.env;
  return createEnv({
    server: {
      JIOSAAVN_DES_KEY: z
        .string({ error: "JIOSAAVN_DES_KEY is required for playback" })
        .min(1, "JIOSAAVN_DES_KEY is required for playback"),
    },
    runtimeEnv,
    emptyStringAsUndefined: true,
    skipValidation:
      options.skipValidation ?? runtimeEnv.SKIP_ENV_VALIDATION === "true",
  });
}
