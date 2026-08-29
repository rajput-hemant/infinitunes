import { createEnv } from "@t3-oss/env-core";

import { clientSchema } from "./schema";

export type ClientEnv = typeof clientSchema;

export interface ClientEnvOptions {
  runtimeEnv: Record<string, string | undefined>;
  skipValidation?: boolean;
  emptyStringAsUndefined?: boolean;
  clientPrefix?: string;
}

export function createClientEnv(options: ClientEnvOptions) {
  const {
    runtimeEnv,
    skipValidation = false,
    emptyStringAsUndefined = true,
    clientPrefix = "NEXT_PUBLIC_",
  } = options;

  return createEnv({
    skipValidation,
    emptyStringAsUndefined,
    server: {},
    client: clientSchema,
    clientPrefix: clientPrefix as "NEXT_PUBLIC_",
    runtimeEnv: runtimeEnv as Record<
      string,
      string | boolean | number | undefined
    >,
  });
}
