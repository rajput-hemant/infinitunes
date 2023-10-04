import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    JIOSAAVN_API_URL: z.string().url({ message: "Invalid URL" }),
  },
  client: {
    NEXT_PUBLIC_JIOSAAVN_API_URL: z.string().url({ message: "Invalid URL" }),
  },
  runtimeEnv: {
    JIOSAAVN_API_URL: process.env.JIOSAAVN_API_URL,
    NEXT_PUBLIC_JIOSAAVN_API_URL: process.env.NEXT_PUBLIC_JIOSAAVN_API_URL,
  },
});
