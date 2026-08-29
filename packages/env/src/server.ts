import { createEnv } from "@t3-oss/env-core";

import {
  clientSchema,
  createServerSchema,
  runtimeKeys,
  type EnvContext,
} from "./schema";

export type ServerEnv = ReturnType<typeof createServerSchema>;

export interface ServerEnvOptions {
  runtimeEnv?: Record<string, string | undefined>;
  context?: EnvContext;
  skipValidation?: boolean;
  emptyStringAsUndefined?: boolean;
  clientPrefix?: string;
}

export function createServerEnv(options: ServerEnvOptions = {}) {
  const {
    runtimeEnv = process.env,
    context = {},
    skipValidation = process.env.SKIP_ENV_VALIDATION === "true",
    emptyStringAsUndefined = true,
    clientPrefix = "NEXT_PUBLIC_",
  } = options;

  return createEnv({
    skipValidation,
    emptyStringAsUndefined,
    server: createServerSchema(context),
    client: clientSchema,
    runtimeEnv: runtimeEnv as Record<
      string,
      string | boolean | number | undefined
    >,
    clientPrefix: clientPrefix as "NEXT_PUBLIC_",
  });
}

export { runtimeKeys };
